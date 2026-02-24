import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: carers }, { data: docs }, { data: reads }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'carer').order('full_name'),
    supabase.from('documents').select('*').eq('status', 'published').order('title'),
    supabase.from('document_reads').select('*'),
  ])

  const publishedCount = docs?.length ?? 0
  const totalPossible = (carers?.length ?? 0) * publishedCount
  const totalReads = reads?.length ?? 0
  const overallPct = totalPossible > 0 ? Math.round((totalReads / totalPossible) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Reports</h1>
          <p className="text-slate-500 mt-1">Overview of document read compliance across the team</p>
        </div>
        <Link
          href="/api/reports/export"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className={`text-3xl font-bold ${overallPct === 100 ? 'text-green-600' : overallPct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {overallPct}%
          </p>
          <p className="text-slate-500 text-sm mt-1">Overall Compliance</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-3xl font-bold text-slate-900">{carers?.length ?? 0}</p>
          <p className="text-slate-500 text-sm mt-1">Carers</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-3xl font-bold text-slate-900">{publishedCount}</p>
          <p className="text-slate-500 text-sm mt-1">Published Documents</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Per-carer */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">By Carer</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(carers ?? []).map((carer) => {
              const n = (reads ?? []).filter((r) => r.user_id === carer.id).length
              const pct = publishedCount > 0 ? Math.round((n / publishedCount) * 100) : 0
              return (
                <div key={carer.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{carer.full_name ?? carer.email}</p>
                      <p className="text-xs text-slate-400">{carer.email}</p>
                    </div>
                    <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{n}/{publishedCount}</span>
                  </div>
                </div>
              )
            })}
            {!carers?.length && (
              <p className="text-sm text-slate-400 px-6 py-6 text-center">No carers yet.</p>
            )}
          </div>
        </div>

        {/* Per-document */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">By Document</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(docs ?? []).map((doc) => {
              const n = (reads ?? []).filter((r) => r.document_id === doc.id).length
              const total = carers?.length ?? 0
              const pct = total > 0 ? Math.round((n / total) * 100) : 0
              return (
                <div key={doc.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-900 truncate pr-4">{doc.title}</p>
                    <span className={`text-sm font-bold whitespace-nowrap ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{n}/{total}</span>
                  </div>
                </div>
              )
            })}
            {!docs?.length && (
              <p className="text-sm text-slate-400 px-6 py-6 text-center">No published documents yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
