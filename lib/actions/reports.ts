'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateWaterIntakeReport } from '@/lib/gemini/client'
import type { AIReport } from '@/lib/supabase/types'
import { subDays, format } from 'date-fns'
import { revalidatePath } from 'next/cache'

// 임시 유저 ID
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * AI 리포트 생성
 */
export async function generateAIReport(
    startDate?: Date,
    endDate?: Date
) {
    try {
        const supabase = createServerSupabaseClient()

        // 기본값: 최근 7일 (오늘 포함)
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
        // 만약 이미 해당 기간에 리포트가 있으면 새로 생성하는 것을 허용할지? 
        // 여기서는 단순히 추가 생성 허용. (히스토리성)
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

        // 리포트 페이지 재검증
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
