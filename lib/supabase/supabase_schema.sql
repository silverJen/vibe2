-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users table (향후 확장용, 현재 MVP에서는 temp-user-id 사용)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Water records table
CREATE TABLE IF NOT EXISTS water_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid, -- 임시 유저 ID
    intake_level VARCHAR(20) CHECK (intake_level IN ('high', 'medium', 'low')),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for water_records
CREATE INDEX IF NOT EXISTS idx_water_records_user_date ON water_records(user_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_water_records_date ON water_records(record_date DESC);

-- 4. Condition records table
CREATE TABLE IF NOT EXISTS condition_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    conditions TEXT[] DEFAULT '{}',
    note TEXT,
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, record_date)
);

-- Indexes for condition_records
CREATE INDEX IF NOT EXISTS idx_condition_records_user_date ON condition_records(user_id, record_date DESC);

-- 5. AI reports table
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    content TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    report_type VARCHAR(20) DEFAULT 'weekly',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for ai_reports
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_created ON ai_reports(user_id, created_at DESC);

-- 6. RLS (Row Level Security) 설정
-- MVP 단계에서는 복잡성을 줄이기 위해 RLS를 비활성화 하거나 모든 접근을 허용합니다.
-- 여기서는 일단 테이블 생성 시 기본적으로 RLS가 꺼져있을 수 있으나, 명시적으로 켜고 정책을 추가하는 것이 안전하지만
-- 요청사항에 따라 "RLS 비활성화(MVP 단계)"를 준수하여 별도 ALTER TABLE ... ENABLE ROW LEVEL SECURITY 명령을 실행하지 않습니다.
-- 만약 Supabase 프로젝트 설정에서 기본적으로 RLS가 켜져있다면, 아래 명령어로 비활성화 할 수 있습니다:
-- ALTER TABLE water_records DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE condition_records DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_reports DISABLE ROW LEVEL SECURITY;

-- 7. 임시 사용자 데이터 생성 (선택 사항)
-- 앱에서 사용할 고정 'temp-user-id'가 있다면 여기서 미리 넣어두는 것이 좋음
-- 실제 코드에서는 'temp-user-id'라는 문자열을 UUID로 변환해서 쓸지, 아니면 고정된 UUID를 쓸지 결정해야 함.
-- 편의상 위 테이블 정의에서는 0000... UUID를 기본값으로 잡았으나, 
-- 코드상의 TEMP_USER_ID 상수와 일치시켜야 합니다.

COMMENT ON TABLE water_records IS '물 섭취 기록';
COMMENT ON TABLE condition_records IS '일일 컨디션 기록';
COMMENT ON TABLE ai_reports IS 'AI가 분석한 리포트';
