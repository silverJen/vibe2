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
            {selectedDayStats.totalCount > 0 && (
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
