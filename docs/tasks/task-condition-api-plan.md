# Task 5: 컨디션 기록 API

> **우선순위**: 🟢 낮음 (선택적)  
> **예상 시간**: 30분  
> **의존성**: Task 1 완료 필요 (다른 Task와 병렬 가능)

---

## 📋 작업 개요

사용자의 컨디션(피로, 붓기 등)을 기록하고, AI 리포트에서 물 섭취와의 상관관계를 분석할 수 있도록 합니다.

---

## 🎯 작업 목표

1. 컨디션 기록 CRUD Server Actions 구현
2. AI 리포트 생성 시 컨디션 데이터 포함
3. (선택) 프론트엔드 UI 추가

---

## 📚 필수 참고 문서

- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md) (섹션 6.2)
- [User Stories](file:///Users/Life/Desktop/20251220_Trevari/docs/user_stories.md) (US-015, US-016)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md)
- [Supabase Client](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/client.ts)
- [Types](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/types.ts)

---

## 🔧 세부 작업 내용

### 1. lib/actions/conditions.ts 생성

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { ConditionRecord } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

const TEMP_USER_ID = 'temp-user-id'

/**
 * 컨디션 기록 생성
 * (하루에 하나만 허용 - UNIQUE 제약)
 */
export async function createConditionRecord(
  conditions: string[],
  note?: string,
  date?: Date
) {
  try {
    const supabase = createServerSupabaseClient()
    const recordDate = date || new Date()
    
    const dateStr = format(recordDate, 'yyyy-MM-dd')
    
    // 기존 기록 확인
    const { data: existing } = await supabase
      .from('condition_records')
      .select('id')
      .eq('user_id', TEMP_USER_ID)
      .eq('record_date', dateStr)
      .single()
    
    if (existing) {
      return {
        success: false,
        error: '오늘은 이미 컨디션을 기록했습니다. 수정하시겠어요?'
      }
    }
    
    const { data, error } = await supabase
      .from('condition_records')
      .insert({
        user_id: TEMP_USER_ID,
        conditions,
        note: note || null,
        record_date: dateStr,
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    
    return {
      success: true,
      data: data as ConditionRecord,
      message: '컨디션을 기록했습니다! 💭'
    }
  } catch (error) {
    console.error('Error creating condition record:', error)
    return {
      success: false,
      error: '컨디션 기록에 실패했습니다.'
    }
  }
}

/**
 * 특정 날짜의 컨디션 조회
 */
export async function getConditionRecordByDate(date: Date) {
  try {
    const supabase = createServerSupabaseClient()
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('condition_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .eq('record_date', dateStr)
      .single()
    
    // 기록이 없는 경우는 에러가 아님
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      success: true,
      data: data as ConditionRecord | null
    }
  } catch (error) {
    console.error('Error fetching condition record:', error)
    return {
      success: false,
      error: '컨디션 조회에 실패했습니다.'
    }
  }
}

/**
 * 기간별 컨디션 조회
 * AI 리포트 생성 시 사용
 */
export async function getConditionRecordsByDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('condition_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('record_date', { ascending: true })
    
    if (error) throw error
    
    return {
      success: true,
      data: data as ConditionRecord[]
    }
  } catch (error) {
    console.error('Error fetching condition records:', error)
    return {
      success: false,
      error: '컨디션 조회에 실패했습니다.',
      data: [] as ConditionRecord[]
    }
  }
}

/**
 * 컨디션 기록 수정
 */
export async function updateConditionRecord(
  recordId: string,
  conditions: string[],
  note?: string
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('condition_records')
      .update({
        conditions,
        note: note || null,
      })
      .eq('id', recordId)
      .eq('user_id', TEMP_USER_ID)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    
    return {
      success: true,
      data: data as ConditionRecord,
      message: '컨디션을 수정했습니다!'
    }
  } catch (error) {
    console.error('Error updating condition record:', error)
    return {
      success: false,
      error: '컨디션 수정에 실패했습니다.'
    }
  }
}

/**
 * 컨디션 기록 삭제
 */
export async function deleteConditionRecord(recordId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('condition_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', TEMP_USER_ID)
    
    if (error) throw error
    
    revalidatePath('/')
    
    return {
      success: true,
      message: '컨디션 기록을 삭제했습니다.'
    }
  } catch (error) {
    console.error('Error deleting condition record:', error)
    return {
      success: false,
      error: '컨디션 삭제에 실패했습니다.'
    }
  }
}

/**
 * 오늘의 컨디션 조회
 */
export async function getTodayConditionRecord() {
  return getConditionRecordByDate(new Date())
}
```

---

### 2. AI 리포트와 연동

lib/actions/reports.ts의 `generateAIReport` 함수는 이미 컨디션 데이터를 조회하도록 구현되어 있습니다 (Task 4 참조).

컨디션 데이터가 있으면 자동으로 Gemini 프롬프트에 포함됩니다.

---

### 3. (선택) 프론트엔드 컴포넌트 추가

#### components/features/condition/condition-prompt.tsx (새로 생성)

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { createConditionRecord, getTodayConditionRecord, updateConditionRecord } from "@/lib/actions/conditions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const CONDITION_OPTIONS = [
  { value: 'fatigue', label: '피로' },
  { value: 'swelling', label: '붓기' },
  { value: 'headache', label: '두통' },
  { value: 'dry_skin', label: '피부 건조' },
  { value: 'good', label: '좋음' },
]

export function ConditionPrompt() {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingRecord, setExistingRecord] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadTodayCondition()
  }, [])

  const loadTodayCondition = async () => {
    const result = await getTodayConditionRecord()
    if (result.success && result.data) {
      setExistingRecord(result.data)
      setSelectedConditions(result.data.conditions)
      setNote(result.data.note || '')
      setIsExpanded(true)
    }
  }

  const handleToggleCondition = (value: string) => {
    setSelectedConditions(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = async () => {
    if (selectedConditions.length === 0) {
      toast.error('컨디션을 선택해주세요')
      return
    }

    setIsSubmitting(true)

    const result = existingRecord
      ? await updateConditionRecord(existingRecord.id, selectedConditions, note)
      : await createConditionRecord(selectedConditions, note)

    if (result.success) {
      toast.success(result.message)
      router.refresh()
      setIsExpanded(false)
    } else {
      toast.error(result.error || '컨디션 기록에 실패했습니다')
    }

    setIsSubmitting(false)
  }

  if (!isExpanded) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">오늘 컨디션은 어떠세요?</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {existingRecord ? '수정하기' : '기록하기'}
          </span>
        </button>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">오늘의 컨디션</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            닫기
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">어떤 상태인가요? (복수 선택 가능)</p>
          <div className="grid grid-cols-2 gap-2">
            {CONDITION_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={selectedConditions.includes(option.value)}
                  onCheckedChange={() => handleToggleCondition(option.value)}
                />
                <label
                  htmlFor={option.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">추가 메모 (선택)</p>
          <Textarea
            placeholder="오늘 특별히 느낀 점이 있나요?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedConditions.length === 0}
          className="w-full"
        >
          {isSubmitting ? '저장 중...' : existingRecord ? '수정하기' : '저장하기'}
        </Button>
      </div>
    </Card>
  )
}
```

#### app/page.tsx에 추가

```typescript
import { IntakeRecorder } from "@/components/features/intake/intake-recorder"
import { TodayIntakeList } from "@/components/features/intake/today-intake-list"
import { ConditionPrompt } from "@/components/features/condition/condition-prompt"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function HomePage() {
  const today = new Date()

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-8 lg:p-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{format(today, "yyyy년 M월 d일", { locale: ko })}</h1>
            <p className="text-muted-foreground">오늘의 물 섭취를 기록해보세요</p>
          </div>

          {/* Intake Recorder */}
          <IntakeRecorder />

          {/* Condition Prompt (새로 추가) */}
          <ConditionPrompt />

          {/* Today's Records */}
          <TodayIntakeList />
        </div>
      </main>
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `lib/actions/conditions.ts` 작성
- [ ] 6개 Server Actions 구현
  - [ ] createConditionRecord
  - [ ] getConditionRecordByDate
  - [ ] getConditionRecordsByDateRange
  - [ ] updateConditionRecord
  - [ ] deleteConditionRecord
  - [ ] getTodayConditionRecord
- [ ] AI 리포트에서 컨디션 데이터 활용 확인
- [ ] (선택) `condition-prompt.tsx` 컴포넌트 생성
- [ ] (선택) 홈 페이지에 컨디션 입력 UI 추가

---

## 🧪 테스트 방법

1. **컨디션 기록 테스트**
   - 홈 페이지에서 컨디션 입력
   - 복수 선택 가능 확인
   - 메모 추가 기능 확인

2. **하루 하나 제약 확인**
   - 오늘 컨디션 기록 후 다시 시도
   - 수정 모드로 전환 확인

3. **AI 리포트 연동 확인**
   - 컨디션 기록 후 AI 리포트 생성
   - 리포트에서 컨디션 언급 확인

4. **Supabase 확인**
   - condition_records 테이블에 데이터 저장 확인
   - UNIQUE 제약 동작 확인

---

## 🚨 주의사항

1. **하루 하나**: 같은 날짜에 중복 기록 방지 (UNIQUE 제약)
2. **선택적 기능**: 컨디션이 없어도 앱 전체 동작에 문제 없음
3. **AI 연동**: reports.ts에서 컨디션 데이터가 있으면 자동으로 포함

---

## 📝 향후 확장

- 컨디션 히스토리 페이지
- 컨디션-물 섭취 상관관계 시각화
- 맞춤형 컨디션 옵션 추가

---

**작성일**: 2025-12-20  
**Task 번호**: Task 5  
**상태**: 준비
