# Task 4: AI 리포트 생성 API

> **우선순위**: 🟠 높음  
> **예상 시간**: 60분  
> **의존성**: Task 1, Task 2 완료 필요

---

## 📋 작업 개요

Google Gemini API를 사용하여 물 섭취 패턴을 분석하고 자연어 리포트를 생성하는 핵심 기능을 구현합니다.

---

## 🎯 작업 목표

1. Gemini API 클라이언트 구현
2. AI 리포트 생성 Server Actions 구현
3. 프론트엔드 컴포넌트와 연동
4. 데이터 부족 상황 처리

---

## 📚 필수 참고 문서

- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md) (섹션 6.1, 7.2)
- [User Stories](file:///Users/Life/Desktop/20251220_Trevari/docs/user_stories.md) (US-009 ~ US-014)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md) (섹션 5.3)
- [Supabase Client](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/client.ts)
- [Water Actions](file:///Users/Life/Desktop/20251220_Trevari/lib/actions/water.ts)

---

## 🔗 연동 대상 컴포넌트

- [app/reports/page.tsx](file:///Users/Life/Desktop/20251220_Trevari/app/reports/page.tsx)
- [report-generator.tsx](file:///Users/Life/Desktop/20251220_Trevari/components/features/reports/report-generator.tsx)
- [report-list.tsx](file:///Users/Life/Desktop/20251220_Trevari/components/features/reports/report-list.tsx)

---

## 🔧 세부 작업 내용

### 1. Gemini API 패키지 설치

```bash
npm install @google/generative-ai
```

---

### 2. lib/gemini/client.ts 생성

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Gemini AI 클라이언트
 * 모델: gemini-3-flash-preview (필수)
 */
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3-flash-preview',
})

/**
 * 물 섭취 패턴 분석 리포트 생성
 */
export async function generateWaterIntakeReport(
  waterRecords: any[],
  conditionRecords: any[] = []
) {
  const prompt = createReportPrompt(waterRecords, conditionRecords)
  
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return { success: true, content: text }
  } catch (error) {
    console.error('Gemini API error:', error)
    return { 
      success: false, 
      error: 'AI 리포트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' 
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
    const date = record.record_date
    if (!recordsByDate.has(date)) {
      recordsByDate.set(date, [])
    }
    recordsByDate.get(date).push(record)
  })
  
  // 통계 계산
  const totalDays = recordsByDate.size
  const totalRecords = waterRecords.length
  const avgPerDay = (totalRecords / totalDays).toFixed(1)
  
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
    const day = new Date(record.recorded_at).getDay()
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  
  return Object.entries(dayCounts)
    .map(([day, count]) => `${dayNames[Number(day)]}: ${count}회`)
    .join(', ')
}

function analyzeTimePattern(records: any[]) {
  const morning = records.filter(r => {
    const hour = new Date(r.recorded_at).getHours()
    return hour >= 6 && hour < 12
  }).length
  
  const afternoon = records.filter(r => {
    const hour = new Date(r.recorded_at).getHours()
    return hour >= 12 && hour < 18
  }).length
  
  const evening = records.filter(r => {
    const hour = new Date(r.recorded_at).getHours()
    return hour >= 18 && hour < 22
  }).length
  
  const night = records.filter(r => {
    const hour = new Date(r.recorded_at).getHours()
    return hour >= 22 || hour < 6
  }).length
  
  return `아침: ${morning}회, 오후: ${afternoon}회, 저녁: ${evening}회, 밤: ${night}회`
}
```

---

### 3. lib/actions/reports.ts 생성

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/gemini/client'
import type { AIReport } from '@/lib/supabase/types'
import { subDays, format } from 'date-fns'
import { revalidatePath } from 'next/cache'

const TEMP_USER_ID = 'temp-user-id'

/**
 * AI 리포트 생성
 */
export async function generateAIReport(
  startDate?: Date,
  endDate?: Date
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 기본값: 최근 7일
    const end = endDate || new Date()
    const start = startDate || subDays(end, 6)
    
    const startDateStr = format(start, 'yyyy-MM-dd')
    const endDateStr = format(end, 'yyyy-MM-dd')
    
    // 1. 물 섭취 데이터 조회
    const { data: waterData, error: waterError } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('recorded_at', { ascending: true })
    
    if (waterError) throw waterError
    
    // 2. 컨디션 데이터 조회 (있는 경우)
    const { data: conditionData } = await supabase
      .from('condition_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
    
    // 3. Gemini API 호출
    const aiResult = await generateWaterIntakeReport(
      waterData || [],
      conditionData || []
    )
    
    if (!aiResult.success) {
      throw new Error(aiResult.error)
    }
    
    // 4. 리포트 저장
    const { data: report, error: reportError } = await supabase
      .from('ai_reports')
      .insert({
        user_id: TEMP_USER_ID,
        content: aiResult.content,
        start_date: startDateStr,
        end_date: endDateStr,
        report_type: startDate && endDate ? 'custom' : 'weekly',
        metadata: {
          record_count: waterData?.length || 0,
          has_condition: (conditionData?.length || 0) > 0,
        }
      })
      .select()
      .single()
    
    if (reportError) throw reportError
    
    revalidatePath('/reports')
    
    return {
      success: true,
      data: report as AIReport,
      message: 'AI 리포트가 생성되었습니다! ✨'
    }
  } catch (error) {
    console.error('Error generating AI report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 리포트 생성에 실패했습니다.'
    }
  }
}

/**
 * AI 리포트 목록 조회
 */
export async function getAIReports(limit: number = 10) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return {
      success: true,
      data: data as AIReport[]
    }
  } catch (error) {
    console.error('Error fetching AI reports:', error)
    return {
      success: false,
      error: '리포트 목록 조회에 실패했습니다.',
      data: [] as AIReport[]
    }
  }
}

/**
 * 특정 AI 리포트 조회
 */
export async function getAIReportById(reportId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', TEMP_USER_ID)
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: data as AIReport
    }
  } catch (error) {
    console.error('Error fetching AI report:', error)
    return {
      success: false,
      error: '리포트 조회에 실패했습니다.'
    }
  }
}

/**
 * AI 리포트 삭제
 */
export async function deleteAIReport(reportId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('ai_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', TEMP_USER_ID)
    
    if (error) throw error
    
    revalidatePath('/reports')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting AI report:', error)
    return {
      success: false,
      error: '리포트 삭제에 실패했습니다.'
    }
  }
}
```

---

### 4. 프론트엔드 연동

#### report-generator.tsx

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { generateAIReport } from "@/lib/actions/reports"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setIsGenerating(true)

    const result = await generateAIReport()
    
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.error || 'AI 리포트 생성에 실패했습니다.')
    }
    
    setIsGenerating(false)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-water/10 to-background border-water/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-water" />
            <h2 className="text-xl font-semibold">새 리포트 생성</h2>
          </div>
          <p className="text-muted-foreground">최근 7일간의 물 섭취 패턴을 AI가 분석해드립니다</p>
        </div>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-water hover:bg-water/90 text-white"
        >
          {isGenerating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              리포트 생성
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
```

#### report-list.tsx

```typescript
import { getAIReports } from "@/lib/actions/reports"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export async function ReportList() {
  const result = await getAIReports()
  const reports = result.data || []

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">리포트 히스토리</h2>
      
      {reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          아직 생성된 리포트가 없습니다.<br />
          위에서 새 리포트를 생성해보세요!
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start gap-4">
                <FileText className="h-5 w-5 text-water mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(report.start_date), 'M월 d일', { locale: ko })} ~{' '}
                        {format(new Date(report.end_date), 'M월 d일', { locale: ko })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(report.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                    <span className="text-xs bg-water/10 text-water px-2 py-1 rounded">
                      {report.report_type === 'weekly' ? '주간 리포트' : '맞춤 리포트'}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">{report.content}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## ✅  완료 체크리스트

- [ ] `@google/generative-ai` 패키지 설치
- [ ] `lib/gemini/client.ts` 작성
- [ ] `lib/actions/reports.ts` 작성
- [ ] 4개 Server Actions 구현
  - [ ] generateAIReport
  - [ ] getAIReports
  - [ ] getAIReportById
  - [ ] deleteAIReport
- [ ] `report-generator.tsx` 연동
- [ ] `report-list.tsx` 연동
- [ ] `.env.local`에 GEMINI_API_KEY 추가
- [ ] 데이터 부족 시 처리 구현

---

## 🧪 테스트 방법

1. **리포트 생성 테스트**
   - 리포트 페이지에서 "리포트 생성" 클릭
   - 생성 중 로딩 상태 확인
   - 생성 완료 후 목록에 추가 확인

2. **내용 품질 확인**
   - 긍정적이고 공감적인 톤
   - 구체적인 패턴 언급
   - 평가·훈계 없음

3. **데이터 부족 테스트**
   - 3일 미만의 데이터로 리포트 생성
   - 격려 메시지 확인

---

## 🚨 주의사항

1. **Gemini 모델**: 반드시 "gemini-3-flash-preview" 사용
2. **API 키 보안**: 환경 변수로만 관리
3. **데이터 제한**: 최대 7일간의 데이터만 전달
4. **에러 처리**: Gemini API 오류 시 사용자 친화적 메시지

---

**작성일**: 2025-12-20  
**Task 번호**: Task 4  
**상태**: 준비
