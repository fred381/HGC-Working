export type UserRole = 'admin' | 'carer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Document {
  id: string
  title: string
  original_content: string | null
  enhanced_content: string | null
  file_url: string | null
  file_name: string | null
  status: 'draft' | 'published' | 'archived'
  review_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface DocumentRead {
  id: string
  document_id: string
  user_id: string
  read_at: string
  quiz_passed: boolean | null
  quiz_score: number | null
}

export interface QuizQuestion {
  id: string
  document_id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
}

export interface DocumentWithStats extends Document {
  total_carers?: number
  read_count?: number
  quiz_questions?: QuizQuestion[]
}
