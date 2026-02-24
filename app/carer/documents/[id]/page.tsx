import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReadDocumentClient from '@/components/read-document-client'
import { QuizQuestion } from '@/types'

export default async function CarerDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: doc }, { data: readRecord }, { data: quiz }] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single(),
    supabase
      .from('document_reads')
      .select('id')
      .eq('document_id', id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('document_id', id)
      .order('order_index'),
  ])

  if (!doc) notFound()

  return (
    <ReadDocumentClient
      documentId={doc.id}
      title={doc.title}
      enhancedContent={doc.enhanced_content}
      originalContent={doc.original_content}
      alreadyRead={!!readRecord}
      quizQuestions={(quiz ?? []) as QuizQuestion[]}
    />
  )
}
