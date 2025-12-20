# Task 3: 히스토리 조회 API

> **우선순위**: 🟡 중간  
> **예상 시간**: 30분  
> **의존성**: Task 1 완료 필요 (Task 2와 병렬 가능)

---

## 📋 작업 개요

히스토리 페이지의 월별 캘린더 뷰에 실제 데이터를 연동하여 사용자의 물 섭취 기록을 시각화합니다.

---

## 🎯 작업 목표

1. 월별/기간별 물 섭취 기록 조회 API 구현
2. 캘린더 컴포넌트에 실제 데이터 연동
3. 선택한 날짜의 상세 기록 표시

---

## 📚 필수 참고 문서

- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md)
- [User Stories](file:///Users/Life/Desktop/20251220_Trevari/docs/user_stories.md) (US-006, US-007, US-008)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md)
- [Supabase Client](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/client.ts)
- [Types](file:///Users/Life/Desktop/20251220_Trevari/lib/supabase/types.ts)

---

## 🔗 연동 대상 컴포넌트

- [app/history/page.tsx](file:///Users/Life/Desktop/20251220_Trevari/app/history/page.tsx)
- [calendar-view.tsx](file:///Users/Life/Desktop/20251220_Trevari/components/features/history/calendar-view.tsx)

---

## 🔧 세부 작업 내용

### 1. lib/actions/history.ts 생성

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { WaterRecord } from '@/lib/supabase/types'
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns'

const TEMP_USER_ID = 'temp-user-id'

export interface DailyRecordSummary {
  date: string
  count: number
  records: WaterRecord[]
  highCount: number
  mediumCount: number
  lowCount: number
}

/**
 * 월별 물 섭취 기록 조회 (날짜별 집계)
 */
export async function getMonthlyRecords(year: number, month: number) {
  try {
    const supabase = createServerSupabaseClient()
    
    // 월의 시작/끝 날짜
    const monthDate = new Date(year, month - 1, 1)
    const startDate = startOfMonth(monthDate)
    const endDate = endOfMonth(monthDate)
    
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')
    
    // 해당 월의 모든 기록 조회
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('recorded_at', { ascending: true })
    
    if (error) throw error
    
    // 날짜별로 그룹화
    const recordsByDate = new Map<string, WaterRecord[]>()
    
    data.forEach((record) => {
      const date = record.record_date
      if (!recordsByDate.has(date)) {
        recordsByDate.set(date, [])
      }
      recordsByDate.get(date)!.push(record as WaterRecord)
    })
    
    // 월의 모든 날짜에 대한 요약 생성
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    const summary: DailyRecordSummary[] = allDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const records = recordsByDate.get(dateStr) || []
      
      return {
        date: dateStr,
        count: records.length,
        records,
        highCount: records.filter(r => r.intake_level === 'high').length,
        mediumCount: records.filter(r => r.intake_level === 'medium').length,
        lowCount: records.filter(r => r.intake_level === 'low').length,
      }
    })
    
    return { success: true, data: summary }
  } catch (error) {
    console.error('Error fetching monthly records:', error)
    return {
      success: false,
      error: '월별 기록 조회에 실패했습니다.',
      data: [] as DailyRecordSummary[]
    }
  }
}

/**
 * 특정 기간의 물 섭취 기록 조회
 */
export async function getDateRangeRecords(startDate: Date, endDate: Date) {
  try {
    const supabase = createServerSupabaseClient()
    
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .gte('record_date', startDateStr)
      .lte('record_date', endDateStr)
      .order('recorded_at', { ascending: true })
    
    if (error) throw error
    
    return { success: true, data: data as WaterRecord[] }
  } catch (error) {
    console.error('Error fetching date range records:', error)
    return {
      success: false,
      error: '기간별 기록 조회에 실패했습니다.',
      data: [] as WaterRecord[]
    }
  }
}

/**
 * 특정 날짜의 상세 통계
 */
export async function getDailyStatistics(date: Date) {
  try {
    const supabase = createServerSupabaseClient()
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('user_id', TEMP_USER_ID)
      .eq('record_date', dateStr)
      .order('recorded_at', { ascending: true })
    
    if (error) throw error
    
    const records = data as WaterRecord[]
    
    // 시간대별 분포 (아침, 점심, 저녁, 밤)
    const timeDistribution = {
      morning: records.filter(r => {
        const hour = new Date(r.recorded_at).getHours()
        return hour >= 6 && hour < 12
      }).length,
      afternoon: records.filter(r => {
        const hour = new Date(r.recorded_at).getHours()
        return hour >= 12 && hour < 18
      }).length,
      evening: records.filter(r => {
        const hour = new Date(r.recorded_at).getHours()
        return hour >= 18 && hour < 22
      }).length,
      night: records.filter(r => {
        const hour = new Date(r.recorded_at).getHours()
        return hour >= 22 || hour < 6
      }).length,
    }
    
    return {
      success: true,
      data: {
        date: dateStr,
        totalCount: records.length,
        records,
        highCount: records.filter(r => r.intake_level === 'high').length,
        mediumCount: records.filter(r => r.intake_level === 'medium').length,
        lowCount: records.filter(r => r.intake_level === 'low').length,
        timeDistribution,
      }
    }
  } catch (error) {
    console.error('Error fetching daily statistics:', error)
    return {
      success: false,
      error: '상세 통계 조회에 실패했습니다.',
    }
  }
}
```

---

### 2. calendar-view.tsx 연동

```typescript
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react"
import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ko } from "date-fns/locale"
import { getMonthlyRecords, getDailyStatistics, type DailyRecordSummary } from "@/lib/actions/history"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthlyData, setMonthlyData] = useState<DailyRecordSummary[]>([])
  const [selectedDayStats, setSelectedDayStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startDayOfWeek = getDay(monthStart)
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i)

  // 월별 데이터 로드
  useEffect(() => {
    loadMonthlyData()
  }, [currentDate])

  // 선택한 날짜의 상세 데이터 로드
  useEffect(() => {
    if (selectedDate) {
      loadDailyStats(selectedDate)
    }
  }, [selectedDate])

  const loadMonthlyData = async () => {
    setIsLoading(true)
    const result = await getMonthlyRecords(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    )
    if (result.success) {
      setMonthlyData(result.data)
    }
    setIsLoading(false)
  }

  const loadDailyStats = async (date: Date) => {
    const result = await getDailyStatistics(date)
    if (result.success) {
      setSelectedDayStats(result.data)
    }
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const getIntakeLevel = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = monthlyData.find(d => d.date === dateStr)
    
    if (!dayData || dayData.count === 0) return 'none'
    if (dayData.count >= 3) return 'high'
    if (dayData.count >= 1) return 'medium'
    return 'none'
  }

  const getDayCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = monthlyData.find(d => d.date === dateStr)
    return dayData?.count || 0
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{format(currentDate, "yyyy년 M월", { locale: ko })}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day labels */}
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Calendar days */}
          {daysInMonth.map((date) => {
            const intakeLevel = getIntakeLevel(date)
            const dayCount = getDayCount(date)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isCurrentDay = isToday(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded-lg border transition-all
                  ${isSelected ? "border-water bg-water/10" : "border-border hover:border-water/50"}
                  ${isCurrentDay ? "ring-2 ring-water/30" : ""}
                  ${!isSameMonth(date, currentDate) ? "opacity-30" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm mb-1">{format(date, "d")}</span>
                  {intakeLevel !== "none" && (
                    <div className="flex flex-col items-center gap-0.5">
                      <Droplets className={`h-3 w-3 ${intakeLevel === "high" ? "text-water" : "text-water/40"}`} />
                      <span className="text-[10px] text-muted-foreground">{dayCount}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && selectedDayStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{format(selectedDate, "M월 d일", { locale: ko })} 상세 기록</h3>
          
          <div className="space-y-4">
            {/* 전체 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-water">{selectedDayStats.totalCount}</p>
                <p className="text-sm text-muted-foreground">총 기록</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedDayStats.highCount}</p>
                <p className="text-sm text-muted-foreground">마셨음</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedDayStats.mediumCount}</p>
                <p className="text-sm text-muted-foreground">조금</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedDayStats.lowCount}</p>
                <p className="text-sm text-muted-foreground">거의 안</p>
              </div>
            </div>

            {/* 시간대별 분포 */}
            {selectedDay Stats.totalCount > 0 && (
              <div>
                <h4 className="font-semibold mb-2">시간대별 분포</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-medium">{selectedDayStats.timeDistribution.morning}</p>
                    <p className="text-xs text-muted-foreground">아침</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-medium">{selectedDayStats.timeDistribution.afternoon}</p>
                    <p className="text-xs text-muted-foreground">오후</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-medium">{selectedDayStats.timeDistribution.evening}</p>
                    <p className="text-xs text-muted-foreground">저녁</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <p className="font-medium">{selectedDayStats.timeDistribution.night}</p>
                    <p className="text-xs text-muted-foreground">밤</p>
                  </div>
                </div>
              </div>
            )}

            {/* 상세 기록 목록 */}
            {selectedDayStats.records.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">상세 기록</h4>
                <div className="space-y-2">
                  {selectedDayStats.records.map((record: any) => (
                    <div key={record.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>{record.intake_level === 'high' ? '마셨음' : record.intake_level === 'medium' ? '조금 마셨음' : '거의 안 마셨음'}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(record.recorded_at), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
```

---

## ✅ 완료 체크리스트

- [ ] `lib/actions/history.ts` 작성
- [ ] 3개 Server Actions 구현
  - [ ] getMonthlyRecords
  - [ ] getDateRangeRecords
  - [ ] getDailyStatistics
- [ ] `calendar-view.tsx` 연동
- [ ] 월 변경 시 데이터 자동 로드
- [ ] 선택한 날짜 상세 정보 표시
- [ ] 시간대별 분포 시각화

---

## 🧪 테스트 방법

1. **월별 조회 테스트**
   - 히스토리 페이지 접속
   - 이전/다음 월 버튼 클릭
   - 각 월의 데이터 로드 확인

2. **날짜 선택 테스트**
   - 기록이 있는 날짜 클릭
   - 상세 통계 표시 확인
   - 시간대별 분포 확인

3. **빈 날짜 처리**
   - 기록이 없는 날짜 클릭
   - 적절한 메시지 표시

---

## 🚨 주의사항

1. **성능**: 월별 조회는 한 번의 쿼리로 처리
2. **빈 날짜**: count가 0인 날짜도 포함하여 반환
3. **시간대**: 한국 시간대 고려

---

**작성일**: 2025-12-20  
**Task 번호**: Task 3  
**상태**: 준비
