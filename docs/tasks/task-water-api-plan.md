# Task 2: 물 섭취 기록 API

> **우선순위**: 🟠 높음  
> **예상 시간**: 45분  
> **의존성**: Task 1 완료 필요

---

## 📋 작업 개요

홈 페이지의 물 섭취 기록 기능과 오늘의 기록 목록을 백엔드 API와 연동합니다.

---

## 🎯 작업 목표

1. 물 섭취 기록 CRUD Server Actions 구현
2. 프론트엔드 컴포넌트와 연동
3. 실시간 데이터 반영 및 에러 처리

---

## 📚 필수 참고 문서

- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md) (섹션 6.1, 7.1)
- [User Stories](file:///Users/Life/Desktop/20251220_Trevari/docs/user_stories.md) (US-001 ~ US-004)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md) (섹션 5)
- [Supabase Client](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/client.ts)
- [Types](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/types.ts)

---

## 🔗 연동 대상 컴포넌트

- [app/page.tsx](file:///Users/Life/Desktop/20251220_Trevari/app/page.tsx)
- [intake-recorder.tsx](file:///Users/Life/Desktop/20251220_Trevari/components/features/intake/intake-recorder.tsx)
- [today-intake-list.tsx](file:///Users/Life/Desktop/20251220_Trevari/components/features/intake/today-intake-list.tsx)

---

## 🔧 세부 작업 내용

### 1. lib/actions/water.ts 생성

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { IntakeLevel, WaterRecord } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

const TEMP_USER_ID = 'temp-user-id'

/**
 * 물 섭취 기록 생성
 */
export async function createWaterRecord(intakeLevel: IntakeLevel) {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    
    // 한국 시간대 고려
    const recordDate = now.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('.').map(s => s.trim()).join('-')
    
    const { data, error } = await supabase
      .from('water_records')
      .insert({
        user_id: TEMP_USER_ID,
        intake_level: intakeLevel,
        recorded_at: now.toISOString(),
        record_date: recordDate,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // 홈 페이지 재검증
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('Error creating water record:', error)
    return { 
      success: false, 
      error: '기록 저장에 실패했습니다. 다시 시도해주세요.' 
    }
  }
}

/**
 * 오늘의 물 섭취 기록 조회
 */
export async function getTodayWaterRecords() {
  try {
    const supabase = createServerSupabaseClient()
    const today = new Date().toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('.').map(s => s.trim()).join('-')
    
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .eq('record_date', today)
      .order('recorded_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, data: data as WaterRecord[] }
  } catch (error) {
    console.error('Error fetching today records:', error)
    return { 
      success: false, 
      error: '기록 조회에 실패했습니다.',
      data: [] as WaterRecord[]
    }
  }
}

/**
 * 특정 날짜의 물 섭취 기록 조회
 */
export async function getWaterRecordsByDate(date: Date) {
  try {
    const supabase = createServerSupabaseClient()
    const dateStr = date.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('.').map(s => s.trim()).join('-')
    
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .eq('record_date', dateStr)
      .order('recorded_at', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: data as WaterRecord[] }
  } catch (error) {
    console.error('Error fetching records by date:', error)
    return { 
      success: false, 
      error: '기록 조회에 실패했습니다.',
      data: [] as WaterRecord[]
    }
  }
}

/**
 * 물 섭취 기록 수정
 */
export async function updateWaterRecord(recordId: string, intakeLevel: IntakeLevel) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('water_records')
      .update({ intake_level: intakeLevel })
      .eq('id', recordId)
      .eq('user_id', TEMP_USER_ID)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating water record:', error)
    return { 
      success: false, 
      error: '기록 수정에 실패했습니다.' 
    }
  }
}

/**
 * 물 섭취 기록 삭제
 */
export async function deleteWaterRecord(recordId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('water_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', TEMP_USER_ID)
    
    if (error) throw error
    
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting water record:', error)
    return { 
      success: false, 
      error: '기록 삭제에 실패했습니다.' 
    }
  }
}
```

---

### 2. intake-recorder.tsx 연동

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Droplets } from "lucide-react"
import { useState } from "react"
import { createWaterRecord } from "@/lib/actions/water"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type IntakeLevel = "high" | "medium" | "low"

export function IntakeRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const router = useRouter()

  const handleRecord = async (level: IntakeLevel) => {
    setIsRecording(true)

    const result = await createWaterRecord(level)
    
    if (result.success) {
      toast.success("물 섭취를 기록했습니다! 💧")
      router.refresh()
    } else {
      toast.error(result.error || "기록에 실패했습니다.")
    }
    
    setIsRecording(false)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-water" />
          <h2 className="text-xl font-semibold">물 섭취 기록</h2>
        </div>

        <div className="grid gap-3">
          <Button
            size="lg"
            className="h-14 bg-water hover:bg-water/90 text-white"
            onClick={() => handleRecord("high")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-5 w-5" />
            마셨음
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 border-water/30 text-water hover:bg-water/10 bg-transparent"
            onClick={() => handleRecord("medium")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-4 w-4" />
            조금 마셨음
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 bg-transparent"
            onClick={() => handleRecord("low")}
            disabled={isRecording}
          >
            <Droplets className="mr-2 h-3 w-3" />
            거의 안 마셨음
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">버튼을 눌러 간편하게 기록하세요</p>
      </div>
    </Card>
  )
}
```

---

### 3. today-intake-list.tsx 연동

```typescript
import { getTodayWaterRecords } from "@/lib/actions/water"
import { Card } from "@/components/ui/card"
import { Droplets } from "lucide-react"
import { format } from "date-fns"

export async function TodayIntakeList() {
  const result = await getTodayWaterRecords()
  const records = result.data || []

  const getLevelText = (level: string) => {
    switch (level) {
      case 'high': return '마셨음'
      case 'medium': return '조금 마셨음'
      case 'low': return '거의 안 마셨음'
      default: return level
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-water'
      case 'medium': return 'text-water/60'
      case 'low': return 'text-water/30'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">오늘의 기록</h2>
      
      {records.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          아직 기록이 없어요. 위에서 기록해보세요!
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Droplets className={`h-5 w-5 ${getLevelColor(record.intake_level)}`} />
                <span>{getLevelText(record.intake_level)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(record.recorded_at), 'HH:mm')}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
```

---

### 4. Sonner Toast 설치 (선택)

```bash
npm install sonner
```

app/layout.tsx에 Toaster 추가:
```typescript
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `lib/actions/water.ts` 작성
- [ ] 5개 Server Actions 구현
  - [ ] createWaterRecord
  - [ ] getTodayWaterRecords
  - [ ] getWaterRecordsByDate
  - [ ] updateWaterRecord
  - [ ] deleteWaterRecord
- [ ] `intake-recorder.tsx` 연동
- [ ] `today-intake-list.tsx` 연동
- [ ] Toast 알림 추가
- [ ] 에러 처리 구현
- [ ] 한국 시간대 처리 확인

---

## 🧪 테스트 방법

1. **기록 생성 테스트**
   - 홈 페이지에서 각 버튼 클릭
   - Toast 알림 확인
   - 오늘의 기록 목록에 추가 확인

2. **실시간 반영 확인**
   - 기록 후 즉시 목록 업데이트
   - 새로고침 후에도 데이터 유지

3. **에러 처리 확인**
   - 네트워크 연결 끊고 기록 시도
   - 에러 메시지 표시 확인

4. **Supabase Dashboard 확인**
   - water_records 테이블에 데이터 저장 확인
   - record_date가 올바른 형식인지 확인

---

## 🚨 주의사항

1. **시간대 처리**: 한국 시간대(Asia/Seoul)로 날짜 계산
2. **revalidatePath**: 데이터 변경 후 페이지 재검증
3. **에러 핸들링**: 사용자 친화적인 메시지 제공
4. **임시 사용자**: TEMP_USER_ID 사용 (향후 인증 기능 추가 시 변경)

---

## 📝 다음 단계

Task 2 완료 후:
- Task 3 (히스토리 조회 API) 또는 Task 4 (AI 리포트) 진행 가능

---

**작성일**: 2025-12-20  
**Task 번호**: Task 2  
**상태**: 준비
