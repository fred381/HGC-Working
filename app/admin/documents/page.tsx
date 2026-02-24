import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DocumentsManageClient from '@/components/documents-manage-client'
import { DocumentWithStats } from '@/types'

export default async function DocumentsPage() {
  const supabase = await createClient()

  const [{ data: docs }, { data: carers }] = await Promise.all([
    supabase
      .from('documents')
      .select('*, quiz_questions(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id')
      .eq('role', 'carer'),
  ])

  const carerCount = carers?.length ?? 0

  const documentIds = (docs ?? []).map((d) => d.id)
  const { data: reads } = documentIds.length
    ? await supabase
        .from('document_reads')
        .select('document_id, user_id')
        .in('document_id', documentIds)
    : { data: [] }

  const documents: DocumentWithStats[] = (docs ?? []).map((doc) => ({
    ...doc,
    total_carers: carerCount,
    read_count: (reads ?? []).filter((r) => r.document_id === doc.id).length,
    quiz_questions: doc.quiz_questions ?? [],
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">Manage all policies and procedures</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>
      <DocumentsManageClient documents={documents} />
    </div>
  )
}
