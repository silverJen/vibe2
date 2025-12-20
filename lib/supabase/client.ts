import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경변수 확인 (빌드 타임에는 에러를 발생시키지 않음)
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('Missing Supabase environment variables')
}

// 1. 클라이언트 컴포넌트용 (Browser)
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '')

// 2. 서버 사이드 / Server Actions용
// 주의: 인증 기능이 붙으면 cookies()를 사용하는 방식으로 변경해야 합니다.
// 현재는 임시 유저 사용 및 관리자 권한으로 DB 접근을 위해 Service Role Key를 사용하거나 
// Anon Key로 접근하되 RLS를 비활성화하는 방식을 가정합니다.
export const createServerSupabaseClient = () => {
    // 서버 사이드에서만 사용해야 하는 Secret Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing')
    }

    // Service Role Key가 있으면 관리자 권한으로 생성 (RLS 우회 가능)
    // 없다면 Anon Key 사용
    const keyToUse = serviceRoleKey || supabaseAnonKey

    if (!keyToUse) {
        throw new Error('Supabase Key is missing')
    }

    return createClient<Database>(supabaseUrl, keyToUse, {
        auth: {
            persistSession: false, // 서버 사이드에서는 세션 지속 불필요
        }
    })
}
