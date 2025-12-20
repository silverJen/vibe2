export type IntakeLevel = 'high' | 'medium' | 'low'
export type ReportType = 'weekly' | 'custom'

// JSON 타입 헬퍼
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
