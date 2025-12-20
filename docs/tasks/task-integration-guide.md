# 백엔드 개발 작업 통합 가이드

> **Water Log 프로젝트 백엔드 개발 업무 분장 및 통합 가이드**

---

## 📋 목차
1. [작업 개요](#작업-개요)
2. [작업 분리 전략](#작업-분리-전략)
3. [작업 단위 및 의존성](#작업-단위-및-의존성)
4. [작업별 프롬프트](#작업별-프롬프트)
5. [통합 체크리스트](#통합-체크리스트)

---

## 작업 개요

### 프로젝트 상황
- ✅ **프론트엔드**: 이미 구현 완료
- ⏳ **백엔드**: 개발 필요
- 🎯 **목표**: 프론트엔드와 백엔드를 연동하여 완전한 기능 구현

### 구현된 프론트엔드 기능
1. **홈 페이지** (`/`): 물 섭취 기록 및 오늘의 기록 목록
2. **히스토리 페이지** (`/history`): 월별 캘린더 뷰
3. **리포트 페이지** (`/reports`): AI 리포트 생성 및 목록

### 필요한 백엔드 기능
1. Supabase 데이터베이스 설정
2. 물 섭취 기록 CRUD API
3. 히스토리 조회 API
4. AI 리포트 생성 API (Gemini 연동)
5. 컨디션 기록 API

---

## 작업 분리 전략

### 병렬 작업 가능 원칙
- 각 작업은 **독립적인 테이블**과 **독립적인 API 엔드포인트**를 다룸
- 공통 설정(Supabase 클라이언트)은 **Task 1**에서 먼저 구현
- 각 작업은 **독립적인 파일**에서 작업하여 충돌 방지

### 파일 분리 구조
```
lib/
├── supabase/
│   ├── client.ts         # Task 1에서 생성
│   └── types.ts          # Task 1에서 생성
├── actions/
│   ├── water.ts          # Task 2에서 생성
│   ├── history.ts        # Task 3에서 생성
│   ├── reports.ts        # Task 4에서 생성
│   └── conditions.ts     # Task 5에서 생성
└── gemini/
    └── client.ts         # Task 4에서 생성
```

---

## 작업 단위 및 의존성

### Task 1: Supabase 설정 및 기본 인프라
- **우선순위**: 🔴 최우선 (모든 작업의 기반)
- **의존성**: 없음
- **예상 시간**: 30분
- **산출물**:
  - Supabase 프로젝트 생성
  - 데이터베이스 테이블 스키마
  - `lib/supabase/client.ts`
  - `lib/supabase/types.ts`
  - 환경 변수 설정

### Task 2: 물 섭취 기록 API
- **우선순위**: 🟠 높음
- **의존성**: Task 1 완료 후
- **예상 시간**: 45분
- **연동 페이지**: 
  - `/` (홈 페이지)
  - 컴포넌트: `intake-recorder.tsx`, `today-intake-list.tsx`
- **산출물**:
  - `lib/actions/water.ts`
  - Server Actions: createWaterRecord, getWaterRecords, updateWaterRecord, deleteWaterRecord

### Task 3: 히스토리 조회 API
- **우선순위**: 🟡 중간
- **의존성**: Task 1 완료 후 (Task 2와 병렬 가능)
- **예상 시간**: 30분
- **연동 페이지**: 
  - `/history` (히스토리 페이지)
  - 컴포넌트: `calendar-view.tsx`
- **산출물**:
  - `lib/actions/history.ts`
  - Server Actions: getMonthlyRecords, getDateRangeRecords

### Task 4: AI 리포트 생성 API
- **우선순위**: 🟠 높음
- **의존성**: Task 1, Task 2 완료 후
- **예상 시간**: 60분
- **연동 페이지**: 
  - `/reports` (리포트 페이지)
  - 컴포넌트: `report-generator.tsx`, `report-list.tsx`
- **산출물**:
  - `lib/gemini/client.ts`
  - `lib/actions/reports.ts`
  - Server Actions: generateAIReport, getAIReports, getAIReportById

### Task 5: 컨디션 기록 API
- **우선순위**: 🟢 낮음 (선택적)
- **의존성**: Task 1 완료 후 (다른 작업과 병렬 가능)
- **예상 시간**: 30분
- **연동 페이지**: 홈 페이지 (추후 컴포넌트 추가)
- **산출물**:
  - `lib/actions/conditions.ts`
  - Server Actions: createConditionRecord, getConditionRecords

---

## 작업별 프롬프트

### Task 1: Supabase 설정 및 기본 인프라

```
[필수 참고 문서]
- @[docs/PRD.md]
- @[docs/software_design.md]

[작업 내용]
Supabase 데이터베이스 설정 및 기본 인프라를 구축해주세요.

[세부 요구사항]
1. Supabase 프로젝트 생성 및 설정
   - 프로젝트 URL과 anon key를 환경 변수로 설정
   
2. 데이터베이스 스키마 생성 (SQL)
   - users 테이블 (향후 확장용, 현재는 미사용)
   - water_records 테이블
     * id (uuid, primary key)
     * user_id (uuid, 향후 확장용)
     * intake_level (text: 'high', 'medium', 'low')
     * recorded_at (timestamp)
     * record_date (date)
     * created_at (timestamp)
   - condition_records 테이블
     * id (uuid, primary key)
     * user_id (uuid)
     * conditions (text[])
     * note (text)
     * record_date (date)
     * created_at (timestamp)
   - ai_reports 테이블
     * id (uuid, primary key)
     * user_id (uuid)
     * content (text)
     * start_date (date)
     * end_date (date)
     * report_type (text: 'weekly', 'custom')
     * metadata (jsonb)
     * created_at (timestamp)

3. lib/supabase/client.ts 생성
   - Supabase 클라이언트 초기화
   - 서버 컴포넌트용 클라이언트
   - 클라이언트 컴포넌트용 클라이언트

4. lib/supabase/types.ts 생성
   - TypeScript 타입 정의
   - Database, WaterRecord, ConditionRecord, AIReport 타입

5. .env.local 파일 설정 가이드 작성

[제약사항]
- 현재는 인증 없이 임시 user_id 사용 (향후 확장 고려)
- Row Level Security(RLS)는 비활성화 (MVP 단계)

[결과물]
- Supabase 프로젝트 설정 완료
- 데이터베이스 테이블 생성 SQL 파일
- lib/supabase/client.ts
- lib/supabase/types.ts
- 환경 변수 설정 가이드
```

---

### Task 2: 물 섭취 기록 API

```
[필수 참고 문서]
- @[docs/PRD.md]
- @[docs/user_stories.md] (US-001, US-002, US-003, US-004)
- @[docs/software_design.md]
- @[lib/supabase/client.ts]
- @[lib/supabase/types.ts]

[연동 대상]
- @[app/page.tsx]
- @[components/features/intake/intake-recorder.tsx]
- @[components/features/intake/today-intake-list.tsx]

[작업 내용]
물 섭취 기록 CRUD 기능을 Server Actions으로 구현해주세요.

[세부 요구사항]
1. lib/actions/water.ts 생성

2. Server Actions 구현
   - createWaterRecord(intakeLevel: 'high' | 'medium' | 'low')
     * 현재 시간으로 기록 생성
     * record_date는 한국 시간 기준 날짜로 저장
     * 성공 시 생성된 레코드 반환
   
   - getTodayWaterRecords()
     * 오늘 날짜의 모든 기록 조회
     * 시간 순으로 정렬
   
   - getWaterRecordsByDate(date: Date)
     * 특정 날짜의 모든 기록 조회
   
   - updateWaterRecord(recordId: string, intakeLevel: 'high' | 'medium' | 'low')
     * 기록 수정
   
   - deleteWaterRecord(recordId: string)
     * 기록 삭제

3. 프론트엔드 연동
   - intake-recorder.tsx의 handleRecord 함수에서 createWaterRecord 호출
   - today-intake-list.tsx에서 getTodayWaterRecords 호출
   - React Query 또는 useSWR로 캐싱 처리 (선택)

4. 에러 핸들링
   - try-catch로 에러 처리
   - 사용자 친화적인 에러 메시지

[제약사항]
- user_id는 임시로 고정값 사용 ('temp-user-id')
- 한국 시간대(Asia/Seoul) 고려

[결과물]
- lib/actions/water.ts
- 프론트엔드 컴포넌트 연동 완료
- 실제 데이터 CRUD 동작 확인
```

---

### Task 3: 히스토리 조회 API

```
[필수 참고 문서]
- @[docs/PRD.md]
- @[docs/user_stories.md] (US-006, US-007, US-008)
- @[docs/software_design.md]
- @[lib/supabase/client.ts]
- @[lib/supabase/types.ts]

[연동 대상]
- @[app/history/page.tsx]
- @[components/features/history/calendar-view.tsx]

[작업 내용]
월별/기간별 물 섭취 기록 조회 API를 구현해주세요.

[세부 요구사항]
1. lib/actions/history.ts 생성

2. Server Actions 구현
   - getMonthlyRecords(year: number, month: number)
     * 특정 월의 모든 기록 조회
     * 날짜별로 그룹화하여 반환
     * 각 날짜별 기록 수와 레벨 정보 포함
   
   - getDateRangeRecords(startDate: Date, endDate: Date)
     * 특정 기간의 기록 조회
     * 주간 리포트 생성 시 사용
   
   - getDailyStatistics(date: Date)
     * 특정 날짜의 상세 통계
     * 시간대별 분포 포함

3. 프론트엔드 연동
   - calendar-view.tsx의 mockIntakeData를 실제 API 호출로 대체
   - 월 변경 시 데이터 자동 로드
   - 선택한 날짜의 상세 기록 표시

4. 데이터 포맷
   - 날짜별 집계 데이터 반환
   - { date: string, count: number, records: WaterRecord[] } 형태

[제약사항]
- 성능 고려: 월별 조회는 한 번의 쿼리로 처리
- 빈 날짜도 포함하여 반환 (count: 0)

[결과물]
- lib/actions/history.ts
- calendar-view.tsx 연동 완료
- 실제 월별 데이터 표시 확인
```

---

### Task 4: AI 리포트 생성 API

```
[필수 참고 문서]
- @[docs/PRD.md]
- @[docs/user_stories.md] (US-009, US-010, US-011, US-014)
- @[docs/software_design.md]
- @[lib/supabase/client.ts]
- @[lib/supabase/types.ts]
- @[lib/actions/water.ts]

[연동 대상]
- @[app/reports/page.tsx]
- @[components/features/reports/report-generator.tsx]
- @[components/features/reports/report-list.tsx]

[작업 내용]
Google Gemini API를 사용하여 AI 리포트 생성 기능을 구현해주세요.

[세부 요구사항]
1. lib/gemini/client.ts 생성
   - Gemini API 클라이언트 초기화
   - 모델: "gemini-3-flash-preview" (필수)
   - generateContent 함수 구현

2. lib/actions/reports.ts 생성

3. Server Actions 구현
   - generateAIReport(startDate?: Date, endDate?: Date)
     * 기본값: 최근 7일
     * 물 섭취 데이터 조회 (water.ts의 함수 재사용)
     * 컨디션 데이터 조회 (있는 경우)
     * Gemini API 호출하여 리포트 생성
     * ai_reports 테이블에 저장
     * 생성된 리포트 반환
   
   - getAIReports(limit?: number)
     * 최근 생성된 리포트 목록 조회
     * 기본값: 10개
     * 최신순 정렬
   
   - getAIReportById(reportId: string)
     * 특정 리포트 조회

4. Gemini 프롬프트 설계
   - 시스템 프롬프트:
     * "당신은 물 섭취 습관을 분석하는 친절한 건강 코치입니다."
     * "평가·훈계 금지, 실패 전제 금지"
     * "관찰 → 해석 → 가벼운 제안 순서"
   - 입력 데이터: JSON 형태로 물 섭취 기록 전달
   - 출력 형식: 자연스러운 한국어 리포트 (300-500자)

5. 프론트엔드 연동
   - report-generator.tsx에서 generateAIReport 호출
   - report-list.tsx에서 getAIReports 호출
   - 생성 중 로딩 상태 표시
   - 생성 완료 후 목록 자동 갱신

6. 데이터 부족 처리
   - 3일 미만의 데이터: 친절한 안내 메시지
   - 데이터 없음: "기록이 없지만 괜찮아요" 메시지

[제약사항]
- Gemini 모델: "gemini-3-flash-preview" 필수
- API 키는 환경 변수에서 관리 (GEMINI_API_KEY)
- 토큰 제한 고려: 최대 7일간의 데이터만 전달

[결과물]
- lib/gemini/client.ts
- lib/actions/reports.ts
- 프론트엔드 연동 완료
- 실제 AI 리포트 생성 동작 확인
- 환경 변수 가이드 업데이트
```

---

### Task 5: 컨디션 기록 API

```
[필수 참고 문서]
- @[docs/PRD.md]
- @[docs/user_stories.md] (US-015, US-016)
- @[docs/software_design.md]
- @[lib/supabase/client.ts]
- @[lib/supabase/types.ts]

[작업 내용]
컨디션 기록 API를 구현해주세요. (선택적 기능)

[세부 요구사항]
1. lib/actions/conditions.ts 생성

2. Server Actions 구현
   - createConditionRecord(conditions: string[], note?: string, date?: Date)
     * 컨디션 기록 생성
     * 하루에 하나만 허용 (UNIQUE 제약)
   
   - getConditionRecordByDate(date: Date)
     * 특정 날짜의 컨디션 조회
   
   - getConditionRecordsByDateRange(startDate: Date, endDate: Date)
     * 기간별 컨디션 조회
     * AI 리포트 생성 시 사용
   
   - updateConditionRecord(recordId: string, conditions: string[], note?: string)
     * 컨디션 수정
   
   - deleteConditionRecord(recordId: string)
     * 컨디션 삭제

3. AI 리포트와 연동
   - reports.ts의 generateAIReport에서 컨디션 데이터 함께 전달
   - 컨디션과 물 섭취의 상관관계 분석

4. 프론트엔드 컴포넌트 (추후 구현)
   - 홈 페이지에 간단한 컨디션 입력 UI 추가 (선택)

[제약사항]
- 하루 하나의 컨디션 기록만 허용
- 선택적 기능이므로 컨디션이 없어도 앱 동작

[결과물]
- lib/actions/conditions.ts
- AI 리포트와 연동
- (선택) 프론트엔드 UI 추가
```

---

## 통합 체크리스트

### Phase 1: 기반 구축
- [ ] Task 1 완료: Supabase 설정 및 기본 인프라
  - [ ] Supabase 프로젝트 생성
  - [ ] 데이터베이스 테이블 생성
  - [ ] lib/supabase/client.ts 구현
  - [ ] lib/supabase/types.ts 구현
  - [ ] 환경 변수 설정

### Phase 2: 핵심 기능 병렬 개발
- [ ] Task 2 완료: 물 섭취 기록 API
  - [ ] lib/actions/water.ts 구현
  - [ ] 프론트엔드 연동 (intake-recorder, today-intake-list)
  - [ ] 실제 CRUD 동작 테스트

- [ ] Task 3 완료: 히스토리 조회 API
  - [ ] lib/actions/history.ts 구현
  - [ ] 프론트엔드 연동 (calendar-view)
  - [ ] 월별 데이터 표시 테스트

### Phase 3: AI 기능 및 확장
- [ ] Task 4 완료: AI 리포트 생성 API
  - [ ] lib/gemini/client.ts 구현
  - [ ] lib/actions/reports.ts 구현
  - [ ] 프론트엔드 연동 (report-generator, report-list)
  - [ ] Gemini API 호출 테스트
  - [ ] 리포트 생성 및 표시 테스트

- [ ] Task 5 완료: 컨디션 기록 API (선택)
  - [ ] lib/actions/conditions.ts 구현
  - [ ] AI 리포트와 연동
  - [ ] (선택) 프론트엔드 UI 추가

### 최종 통합 테스트
- [ ] 전체 기능 End-to-End 테스트
  - [ ] 물 섭취 기록 → 저장 → 조회
  - [ ] 히스토리 월별 조회
  - [ ] AI 리포트 생성 → 저장 → 조회
  - [ ] (선택) 컨디션 기록 및 리포트 반영
- [ ] 에러 케이스 테스트
  - [ ] 네트워크 오류
  - [ ] 데이터 부족 시 AI 리포트
  - [ ] 빈 날짜 조회
- [ ] 성능 테스트
  - [ ] 대량 데이터 조회
  - [ ] AI 리포트 생성 시간

---

## 작업 순서 요약

### 순차 진행 (권장)
```
1. Task 1 (필수 선행) 
   ↓
2. Task 2, Task 3, Task 5 (병렬 가능)
   ↓
3. Task 4 (Task 2 완료 필요)
   ↓
4. 통합 테스트
```

### 병렬 진행 (고급)
```
1. Task 1 완료 후
2. 동시 진행:
   - 개발자 A: Task 2 (물 섭취 기록)
   - 개발자 B: Task 3 (히스토리)
   - 개발자 C: Task 5 (컨디션)
3. Task 2 완료 후
   - 개발자 A: Task 4 (AI 리포트)
4. 통합
```

---

## 환경 변수 설정

### .env.local
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

---

## 참고 문서
- [PRD](file:///Users/Life/Desktop/20251220_Trevari/docs/PRD.md)
- [User Stories](file:///Users/Life/Desktop/20251220_Trevari/docs/user_stories.md)
- [Software Design](file:///Users/Life/Desktop/20251220_Trevari/docs/software_design.md)

---

**작성일**: 2025-12-20  
**버전**: 1.0
