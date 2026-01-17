/**
 * Dify API 클라이언트
 * RAG 지식 기반에서 관련 문서 청크를 검색합니다.
 */

const DIFY_API_BASE_URL = 'https://api.dify.ai/v1'
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID
const DIFY_API_KEY = process.env.DIFY_API_KEY

export interface DifyChunk {
  id: string
  text: string
  score: number
  metadata?: Record<string, any>
}

export interface DifyRetrieveResponse {
  documents: DifyChunk[]
}

/**
 * 질문 임베딩을 사용하여 Dify 지식 기반에서 관련 문서 청크를 검색합니다.
 * 
 * @param queryEmbedding - 질문의 임베딩 벡터
 * @param queryText - 원본 질문 텍스트 (query 필드에 필요)
 * @param topK - 반환할 상위 문서 수 (기본값: 3)
 * @returns 검색된 문서 청크 배열
 */
export async function retrieveChunks(
  queryEmbedding: number[],
  queryText: string,
  topK: number = 3
): Promise<DifyChunk[]> {
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY is not set in environment variables')
  }

  if (!DIFY_DATASET_ID) {
    throw new Error('DIFY_DATASET_ID is not set in environment variables')
  }

  const url = `${DIFY_API_BASE_URL}/datasets/${DIFY_DATASET_ID}/retrieve`

  try {
    const requestBody = {
      query: queryText,
      embedding: queryEmbedding,
      top_k: topK,
    }

    console.log('Dify API request:', { url, top_k: topK, query_length: queryText.length, embedding_length: queryEmbedding.length })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error response:', { status: response.status, statusText: response.statusText, body: errorText })
      throw new Error(`Dify API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as DifyRetrieveResponse
    console.log('Dify API response:', { documents_count: data.documents?.length || 0 })
    return data.documents || []
  } catch (error) {
    console.error('Error retrieving chunks from Dify:', error)
    throw error
  }
}
