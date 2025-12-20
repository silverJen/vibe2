'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { IntakeLevel, WaterRecord } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

// 임시 유저 ID (인증 기능 전까지 사용)
// Supabase 테이블의 기본값과 일치시켜야 함 (0000...)
// 하지만 여기서는 명확성을 위해 텍스트 ID 대신 UUID 형식의 000...을 사용하거나 
// DB 스키마에서 user_id 기본값을 '00000000-0000-0000-0000-000000000000'로 설정했으므로
// 코드에서도 이를 상수화하여 사용합니다.
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * 한국 시간 기준 현재 날짜 문자열 반환 (YYYY-MM-DD)
 */
function getKSTDateString(date: Date = new Date()) {
    return date.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).split('.').map(s => s.trim()).filter(s => s).join('-')
}

/**
 * 물 섭취 기록 생성
 */
export async function createWaterRecord(intakeLevel: IntakeLevel) {
    try {
        const supabase = createServerSupabaseClient()
        const now = new Date()
        const recordDate = getKSTDateString(now)

        const { data, error } = await supabase
            .from('water_records')
            .insert({
                user_id: TEMP_USER_ID,
                intake_level: intakeLevel,
                recorded_at: now.toISOString(),
                record_date: recordDate, // 한국 시간 기준 날짜 저장
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        // 홈 페이지 데이터 갱신
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
        const today = getKSTDateString()

        const { data, error } = await supabase
            .from('water_records')
            .select('*')
            .eq('user_id', TEMP_USER_ID)
            .eq('record_date', today)
            .order('recorded_at', { ascending: false }) // 최신순

        if (error) throw error

        return { success: true, data: data as WaterRecord[] }
    } catch (error) {
        console.error('Error fetching today records:', error)
        return {
            success: false,
            error: '오늘의 기록을 불러오는데 실패했습니다.',
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
        const dateStr = getKSTDateString(date)

        const { data, error } = await supabase
            .from('water_records')
            .select('*')
            .eq('user_id', TEMP_USER_ID)
            .eq('record_date', dateStr)
            .order('recorded_at', { ascending: true }) // 시간순

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
