'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import type { ConditionRecord } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { revalidatePath } from 'next/cache'

// 임시 유저 ID
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * 컨디션 기록 생성
 * (하루에 하나만 허용)
 */
export async function createConditionRecord(
    conditions: string[],
    note?: string,
    date?: Date
) {
    try {
        const supabase = createServerSupabaseClient()
        const recordDate = date || new Date()

        // YYYY-MM-DD
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

        // maybeSingle() 사용 가능하나 명시적 에러 처리를 위해 single() 후 에러코드 확인
        const { data, error } = await supabase
            .from('condition_records')
            .select('*')
            .eq('user_id', TEMP_USER_ID)
            .eq('record_date', dateStr)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116: 결과 없음

        return {
            success: true,
            data: (data as ConditionRecord) || null
        }
    } catch (error) {
        // console.error('Error fetching condition record:', error)
        // 기록이 없는 것은 정상 상황일 수 있으므로 에러 로깅은 생략하거나 디버그 레벨로
        return {
            success: false,
            error: '컨디션 조회에 실패했습니다.'
        }
    }
}

/**
 * 기간별 컨디션 조회 (AI 리포트용)
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
 * 오늘의 컨디션 조회 (헬퍼)
 */
export async function getTodayConditionRecord() {
    return getConditionRecordByDate(new Date())
}
