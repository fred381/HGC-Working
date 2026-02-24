import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CarerHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: docs }, { data: reads }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, updated_at')
      .eq('status', 'published')
      .order('title'),
    supabase
      .from('document_reads')
      .select('document_id')
      .eq('user_id', user!.id),
  ])

  const readIds = new Set((reads ?? []).map((r) => r.document_id))
  const unread = (docs ?? []).filter((d) => !readIds.has(d.id))
  const read = (docs ?? []).filter((d) => readIds.has(d.id))

  const total = (docs ?? []).length
  const pct = total > 0 ? Math.round((read.length / total) * 100) : 100

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
        <p className="text-slate-500 mt-1">Policies and procedures you need to read</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">Your Compliance</p>
          <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{read.length} of {total} documents read</p>
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Unread ({unread.length})
          </h2>
          <div className="space-y-2">
            {unread.map((doc) => (
              <Link
                key={doc.id}
                href={`/carer/documents/${doc.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Updated {new Date(doc.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Unread</span>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Read ({read.length})
          </h2>
          <div className="space-y-2">
            {read.map((doc) => (
              <Link
                key={doc.id}
                href={`/carer/documents/${doc.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-slate-300 transition-all group opacity-75"
              >
                <div>
                  <p className="font-medium text-slate-700">{doc.title}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Read</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No documents published yet.</p>
        </div>
      )}
    </div>
  )
}
