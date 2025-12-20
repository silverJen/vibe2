'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { WaterRecord } from '@/lib/supabase/types'
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns'

// 임시 유저 ID
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'

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

        // 월의 시작/끝 날짜 (month는 1-12)
        // new Date(year, monthIndex)에서 monthIndex는 0-11
        const monthDate = new Date(year, month - 1, 1)
        const startDate = startOfMonth(monthDate)
        const endDate = endOfMonth(monthDate)

        // YYYY-MM-DD 형식으로 변환 (데이터베이스 조회용)
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

        const records = data as WaterRecord[]

        // 날짜별로 그룹화
        const recordsByDate = new Map<string, WaterRecord[]>()

        records.forEach((record) => {
            const date = record.record_date
            if (!recordsByDate.has(date)) {
                recordsByDate.set(date, [])
            }
            recordsByDate.get(date)!.push(record)
        })

        // 월의 모든 날짜에 대한 요약 생성
        const allDays = eachDayOfInterval({ start: startDate, end: endDate })

        const summary: DailyRecordSummary[] = allDays.map((day) => {
            // 로컬 타임존 이슈 방지를 위해 format 사용 시 주의
            // 여기서는 날짜 문자열(YYYY-MM-DD)을 키로 사용
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayRecords = recordsByDate.get(dateStr) || []

            return {
                date: dateStr,
                count: dayRecords.length,
                records: dayRecords,
                highCount: dayRecords.filter(r => r.intake_level === 'high').length,
                mediumCount: dayRecords.filter(r => r.intake_level === 'medium').length,
                lowCount: dayRecords.filter(r => r.intake_level === 'low').length,
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
        // DB의 recorded_at은 UTC+0 (ISOString)일 수 있으므로 로컬 시간 변환 필요
        // 하지만 간편함을 위해 getHours() 사용 시 서버 환경의 시간대에 따름.
        // 한국 시간대 기준 처리가 필요하다면 date-fns-tz 등을 써야 하지만 여기서는 간단히 처리.
        // 클라이언트나 DB 저장 시 이미 조정했다고 가정하거나, 로직에서 9시간 더하는 방식 사용.
        // 여기서는 간단히 new Date(isoString).getHours()를 사용하되, 
        // Vercel 서버(UTC)에서는 한국 시간과 9시간 차이가 남을 수 있음.
        // 정확성을 위해 9시간을 더해 계산하는 헬퍼 함수 사용
        const getKSTHour = (isoString: string) => {
            const d = new Date(isoString)
            // UTC 시간에 9시간을 더해 한국 시간의 '시'를 구함
            // (단, date 객체 자체가 로컬 타임존으로 해석될 때의 복잡성을 피하기 위해 UTC 메서드 활용)
            const utcHour = d.getUTCHours()
            return (utcHour + 9) % 24
        }

        const timeDistribution = {
            morning: records.filter(r => {
                const hour = getKSTHour(r.recorded_at)
                return hour >= 6 && hour < 12
            }).length,
            afternoon: records.filter(r => {
                const hour = getKSTHour(r.recorded_at)
                return hour >= 12 && hour < 18
            }).length,
            evening: records.filter(r => {
                const hour = getKSTHour(r.recorded_at)
                return hour >= 18 && hour < 22
            }).length,
            night: records.filter(r => {
                const hour = getKSTHour(r.recorded_at)
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
