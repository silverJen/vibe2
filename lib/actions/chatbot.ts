'use server'

import { retrieveChunks, type DifyChunk } from '@/lib/dify/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

let genAI: GoogleGenerativeAI | null = null
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey)
}

function getGeminiModel() {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not set')
    }
    return genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
    })
}

export interface ChatbotResponse {
    success: boolean
    answer?: string
    sources?: Array<{
        id: string
        text: string
        score?: number
    }>
    error?: string
}

/**
 * 물먹는도우미 챗봇과 대화
 * RAG 기반으로 Dify 지식 기반을 활용하여 답변을 생성합니다.
 * 
 * @param question - 사용자 질문
 * @returns 답변 및 출처 정보
 */
export async function chatWithAssistant(question: string): Promise<ChatbotResponse> {
    try {
        if (!question.trim()) {
            return {
                success: false,
                error: '질문을 입력해주세요.',
            }
        }

        // 1. Dify 지식 기반에서 관련 문서 청크 검색 (임베딩은 Dify 내부에서 처리)
        const chunks = await retrieveChunks(question, 3)

        console.log('Retrieved chunks:', { count: chunks.length, chunks: chunks.map(c => ({ id: c.id, score: c.score, text_preview: c.text.substring(0, 100) })) })

        if (chunks.length === 0) {
            return {
                success: false,
                error: '관련 정보를 찾을 수 없습니다. (Dify 데이터셋을 확인해주세요)',
            }
        }

        // 3. 검색된 문서 청크를 컨텍스트로 사용하여 답변 생성
        const contextText = chunks
            .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
            .join('\n\n')

        const prompt = `당신은 물 섭취와 수분 관리에 대한 전문 도우미입니다. 아래 제공된 지식 기반 문서를 참고하여 사용자의 질문에 답변해주세요.

지식 기반 문서:
${contextText}

사용자 질문: ${question}

답변 시 다음 사항을 지켜주세요:
1. 제공된 지식 기반 문서의 내용을 기반으로 답변하세요.
2. 한국어로 자연스럽고 친절하게 답변하세요.
3. 필요한 경우 마크다운 형식을 사용하여 구조화하세요 (목록, 강조 등).
4. 불확실한 내용은 추측하지 말고 "제공된 정보로는 정확히 알 수 없습니다"라고 표현하세요.
5. 답변은 간결하고 실용적으로 작성하세요.

답변:`

        const model = getGeminiModel()
        const result = await model.generateContent(prompt)
        const response = await result.response
        const answer = response.text()

        // 4. 출처 정보 구성
        const sources = chunks.map(chunk => ({
            id: chunk.id,
            text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
            score: chunk.score,
        }))

        // 5. 답변 끝에 출처 정보 추가
        const answerWithSources = `${answer}

---

**출처:**
${sources.map((source, index) => `- [${index + 1}] ${source.text}`).join('\n')}`

        return {
            success: true,
            answer: answerWithSources,
            sources,
        }
    } catch (error) {
        console.error('Chatbot error:', error)
        const errorMessage = error instanceof Error ?
            `${error.message}\n\n[스택 추적]\n${error.stack}` :
            '챗봇 응답 생성에 실패했습니다. (알 수 없는 오류)'

        return {
            success: false,
            error: errorMessage,
        }
    }
}
