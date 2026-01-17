import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

// 서버 사이드에서만 실행되므로 환경 변수 체크는 런타임에
// (하지만 apiKey가 없으면 에러가 날 것이므로 클라이언트 생성 시 체크하지 않고 사용 시 체크하거나 try-catch로 감쌉니다)
// 여기서는 전역적으로 인스턴스를 생성하지 않고 함수 내부, 혹은 모듈 레벨에서 초기화하되 
// API 키가 없을 경우를 대비해 안전하게 처리합니다.

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey)
}

/**
 * Gemini AI 클라이언트 모델 가져오기
 * 모델: gemini-3-flash-preview (필수)
 */
function getGeminiModel() {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not set')
    }
    return genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
    })
}

/**
 * 텍스트를 임베딩 벡터로 변환
 * 모델: gemini-embedding-001
 * 
 * @param text - 임베딩할 텍스트
 * @returns 임베딩 벡터 배열
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not set')
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'embedding-001',
        })

        const result = await model.embedContent({
            content: { parts: [{ text }], role: 'user' },
            taskType: 'RETRIEVAL_DOCUMENT',
        })

        const embedding = result.embedding
        if (!embedding || !embedding.values) {
            throw new Error('임베딩 결과가 올바르지 않습니다.')
        }

        return embedding.values
    } catch (error) {
        console.error('Gemini embedding API error:', error)
        throw new Error('임베딩 생성에 실패했습니다.')
    }
}

/**
 * 물 섭취 패턴 분석 리포트 생성
 */
export async function generateWaterIntakeReport(
    waterRecords: any[],
    conditionRecords: any[] = []
) {
    try {
        const model = getGeminiModel()
        const prompt = createReportPrompt(waterRecords, conditionRecords)

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return { success: true, content: text }
    } catch (error) {
        console.error('Gemini API error:', error)
        return {
            success: false,
            error: 'AI 리포트 생성에 실패했습니다. (API Key 설정 등을 확인해주세요)'
        }
    }
}

/**
 * 프롬프트 생성
 */
function createReportPrompt(waterRecords: any[], conditionRecords: any[]) {
    const hasData = waterRecords.length >= 3

    if (!hasData) {
        return `
당신은 물 섭취 습관을 분석하는 친절한 건강 코치입니다.

사용자가 아직 충분한 기록을 남기지 않았습니다. (${waterRecords.length}일)

다음 원칙을 지켜 짧은 격려 메시지를 작성해주세요:
1. 평가·훈계 금지
2. 실패 전제 금지
3. 긍정적이고 부담 없는 톤

메시지는 150자 이내로 작성해주세요.
    `.trim()
    }

    // 날짜별 기록 집계
    const recordsByDate = new Map()
    waterRecords.forEach(record => {
        // record_date 사용
        const date = record.record_date
        if (!recordsByDate.has(date)) {
            recordsByDate.set(date, [])
        }
        recordsByDate.get(date).push(record)
    })

    // 통계 계산
    const totalDays = recordsByDate.size
    const totalRecords = waterRecords.length
    // 0으로 나누기 방지
    const avgPerDay = totalDays > 0 ? (totalRecords / totalDays).toFixed(1) : "0"

    const highCount = waterRecords.filter(r => r.intake_level === 'high').length
    const mediumCount = waterRecords.filter(r => r.intake_level === 'medium').length
    const lowCount = waterRecords.filter(r => r.intake_level === 'low').length

    // 요일별 패턴
    const dayOfWeekPattern = analyzeDayOfWeekPattern(waterRecords)

    // 시간대별 패턴
    const timePattern = analyzeTimePattern(waterRecords)

    return `
당신은 물 섭취 습관을 분석하는 친절하고 공감적인 건강 코치입니다.

📊 분석 기간: 최근 ${totalDays}일
📝 총 기록 횟수: ${totalRecords}회 (평균 ${avgPerDay}회/일)

📈 섭취 레벨 분포:
- 마셨음: ${highCount}회
- 조금 마셨음: ${mediumCount}회
- 거의 안 마셨음: ${lowCount}회

📅 요일별 패턴:
${dayOfWeekPattern}

⏰ 시간대별 패턴:
${timePattern}

${conditionRecords.length > 0 ? `
💭 컨디션 기록:
${JSON.stringify(conditionRecords, null, 2)}
` : ''}

다음 원칙을 반드시 지켜주세요:
1. 평가·훈계 금지 - "잘했어요", "부족해요" 같은 평가 금지
2. 실패 전제 금지 - "목표 미달", "실패" 같은 단어 사용 금지
3. 관찰 → 해석 → 가벼운 제안 순서
4. 공감적이고 긍정적인 톤
5. 구체적인 패턴과 변화 언급

출력 형식:
- 300-500자 분량의 자연스러운 한국어
- 2-3개의 짧은 문단으로 구성
- 이모지 사용 가능 (적절하게)
- 마지막은 가벼운 제안이나 응원으로 마무리

예시:
"지난 일주일 동안 꾸준히 기록하셨네요! 특히 평일 오후에 물을 마시는 횟수가 늘었어요. 

물이 적었던 날에도 기록을 남겨주셨다는 것 자체가 의미 있어요. 완벽하지 않아도 괜찮습니다.

다음 주에는 아침 시간대를 조금 더 신경 써보면 어떨까요? 부담 없이, 생각날 때만요."
  `.trim()
}

function analyzeDayOfWeekPattern(records: any[]) {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayCounts: Record<number, number> = {}

    records.forEach(record => {
        // record_date(YYYY-MM-DD string)를 파싱하면 UTC 자정 기준이 될 수 있음
        // 요일 파악에는 recorded_at 사용이 더 정확할 수 있으나 
        // 여기서는 간단히 record_date 사용
        const day = new Date(record.record_date).getDay()
        dayCounts[day] = (dayCounts[day] || 0) + 1
    })

    return Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1]) // 빈도순 정렬
        .slice(0, 3) // 상위 3개만
        .map(([day, count]) => `${dayNames[Number(day)]}: ${count}회`)
        .join(', ')
}

function analyzeTimePattern(records: any[]) {
    const getKSTHour = (isoString: string) => {
        const d = new Date(isoString)
        const utcHour = d.getUTCHours()
        return (utcHour + 9) % 24
    }

    const morning = records.filter(r => {
        const hour = getKSTHour(r.recorded_at)
        return hour >= 6 && hour < 12
    }).length

    const afternoon = records.filter(r => {
        const hour = getKSTHour(r.recorded_at)
        return hour >= 12 && hour < 18
    }).length

    const evening = records.filter(r => {
        const hour = getKSTHour(r.recorded_at)
        return hour >= 18 && hour < 22
    }).length

    const night = records.filter(r => {
        const hour = getKSTHour(r.recorded_at)
        return hour >= 22 || hour < 6
    }).length

    return `아침: ${morning}회, 오후: ${afternoon}회, 저녁: ${evening}회, 밤: ${night}회`
}
