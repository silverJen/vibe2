# Task 1: Supabase 설정 및 기본 인프라

> **우선순위**: 🔴 최우선  
> **예상 시간**: 30분  
> **의존성**: 없음

---

## 📋 작업 개요

모든 백엔드 작업의 기반이 되는 Supabase 데이터베이스를 설정하고, 프로젝트 전체에서 사용할 공통 클라이언트 및 타입을 구현합니다.

---

## 🎯 작업 목표

1. Supabase 프로젝트 생성 및 설정
2. 데이터베이스 테이블 스키마 생성
3. Supabase 클라이언트 초기화 코드 작성
4. TypeScript 타입 정의
5. 환경 변수 설정

---

## 📚 필수 참고 문서

- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md)

---

## 🔧 세부 작업 내용

### 1. Supabase 프로젝트 생성

#### 단계
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. 프로젝트 이름: `water-log` 또는 원하는 이름
4. 데이터베이스 비밀번호 설정 (안전하게 보관)
5. 리전 선택: Northeast Asia (Seoul)

#### 결과물
- `Project URL`: 환경 변수에 사용
- `anon/public key`: 클라이언트에서 사용
- `service_role key`: 서버에서 사용

---

### 2. 데이터베이스 스키마 생성

#### SQL 스크립트

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (향후 확장용)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Water records table
CREATE TABLE water_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT 'temp-user-id'::uuid,
    intake_level VARCHAR(20) CHECK (intake_level IN ('high', 'medium', 'low')),
    recorded_at TIMESTAMP DEFAULT NOW(),
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for water_records
CREATE INDEX idx_water_records_user_date ON water_records(user_id, record_date DESC);
CREATE INDEX idx_water_records_date ON water_records(record_date DESC);

-- Condition records table
CREATE TABLE condition_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT 'temp-user-id'::uuid,
    conditions TEXT[] DEFAULT '{}',
    note TEXT,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, record_date)
);

-- Indexes for condition_records
CREATE INDEX idx_condition_records_user_date ON condition_records(user_id, record_date DESC);

-- AI reports table
CREATE TABLE ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT 'temp-user-id'::uuid,
    content TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    report_type VARCHAR(20) DEFAULT 'weekly',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ai_reports
CREATE INDEX idx_ai_reports_user_created ON ai_reports(user_id, created_at DESC);

-- 임시 사용자 데이터 (MVP용)
INSERT INTO users (id, name) VALUES ('temp-user-id'::uuid, 'Test User');
```

#### 실행 방법
1. Supabase Dashboard → SQL Editor 접속
2. 위 SQL 스크립트 붙여넣기
3. 실행 (Run)

---

### 3. lib/supabase/client.ts 생성

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 클라이언트 컴포넌트용
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 서버 컴포넌트/Server Actions용
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}
```

---

### 4. lib/supabase/types.ts 생성

```typescript
export type IntakeLevel = 'high' | 'medium' | 'low'
export type ReportType = 'weekly' | 'custom'

export interface WaterRecord {
  id: string
  user_id: string
  intake_level: IntakeLevel
  recorded_at: string
  record_date: string
  created_at: string
}

export interface ConditionRecord {
  id: string
  user_id: string
  conditions: string[]
  note?: string
  record_date: string
  created_at: string
}

export interface AIReport {
  id: string
  user_id: string
  content: string
  start_date: string
  end_date: string
  report_type: ReportType
  metadata: Record<string, any>
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      water_records: {
        Row: WaterRecord
        Insert: Omit<WaterRecord, 'id' | 'created_at'>
        Update: Partial<Omit<WaterRecord, 'id' | 'created_at'>>
      }
      condition_records: {
        Row: ConditionRecord
        Insert: Omit<ConditionRecord, 'id' | 'created_at'>
        Update: Partial<Omit<ConditionRecord, 'id' | 'created_at'>>
      }
      ai_reports: {
        Row: AIReport
        Insert: Omit<AIReport, 'id' | 'created_at'>
        Update: Partial<Omit<AIReport, 'id' | 'created_at'>>
      }
    }
  }
}
```

---

### 5. 환경 변수 설정

#### .env.local 파일 생성

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API (Task 4에서 사용)
GEMINI_API_KEY=your-gemini-api-key
```

#### Vercel 환경 변수 설정
배포 시 Vercel Dashboard에서 동일한 환경 변수 추가

---

### 6. 패키지 설치

```bash
npm install @supabase/supabase-js
```

---

## ✅ 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 테이블 생성 (4개 테이블)
- [ ] 인덱스 생성 완료
- [ ] `lib/supabase/client.ts` 작성
- [ ] `lib/supabase/types.ts` 작성
- [ ] `.env.local` 파일 생성 및 환경 변수 설정
- [ ] `@supabase/supabase-js` 패키지 설치
- [ ] Supabase 연결 테스트 (간단한 쿼리 실행)

---

## 🧪 테스트 방법

### 연결 테스트 코드

간단한 테스트 파일 생성: `lib/supabase/test-connection.ts`

```typescript
import { supabase } from './client'

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('water_records')
      .select('*')
      .limit(1)
    
    if (error) throw error
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}
```

터미널에서 실행:
```bash
npm run dev
# 브라우저 콘솔에서 testConnection() 호출
```

---

## 📝 다음 단계

Task 1 완료 후, 다음 작업들을 병렬로 진행할 수 있습니다:
- Task 2: 물 섭취 기록 API
- Task 3: 히스토리 조회 API
- Task 5: 컨디션 기록 API

---

## 🚨 주의사항

1. **환경 변수 보안**: `.env.local` 파일은 절대 Git에 커밋하지 마세요
2. **Service Role Key**: 클라이언트에서 절대 노출되면 안 됩니다
3. **RLS 비활성화**: MVP 단계에서는 Row Level Security를 비활성화합니다 (나중에 활성화)
4. **임시 사용자**: 현재는 'temp-user-id'를 사용하지만, 향후 인증 기능 추가 시 변경됩니다

---

**작성일**: 2025-12-20  
**Task 번호**: Task 1  
**상태**: 준비
