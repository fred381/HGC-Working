import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ data: documents }, { count: carerCount }] = await Promise.all([
    supabase.from('documents').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'carer'),
  ])

  const published = documents?.filter((d) => d.status === 'published') ?? []
  const drafts = documents?.filter((d) => d.status === 'draft') ?? []

  const today = new Date()
  const overdue = published.filter(
    (d) => d.review_date && new Date(d.review_date) < today
  )
  const dueSoon = published.filter((d) => {
    if (!d.review_date) return false
    const diff = (new Date(d.review_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your policy platform</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Published', value: published.length, color: 'text-green-600' },
          { label: 'Drafts', value: drafts.length, color: 'text-slate-600' },
          { label: 'Team Members', value: carerCount ?? 0, color: 'text-blue-600' },
          { label: 'Overdue Reviews', value: overdue.length, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Overdue for Review
          </h2>
          <ul className="space-y-1">
            {overdue.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{d.title}</span>
                <Link href={`/admin/documents`} className="text-red-500 hover:underline">
                  Review
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-amber-800 mb-3">Due for Review Within 30 Days</h2>
          <ul className="space-y-1">
            {dueSoon.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{d.title}</span>
                <span className="text-amber-500 text-xs">
                  {new Date(d.review_date).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Documents */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Documents</h2>
          <Link href="/admin/documents" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {(documents ?? []).slice(0, 8).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-slate-900 text-sm">{doc.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(doc.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                doc.status === 'published' ? 'bg-green-100 text-green-700'
                  : doc.status === 'archived' ? 'bg-slate-100 text-slate-500'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
          {!documents?.length && (
            <p className="text-slate-400 text-sm px-6 py-8 text-center">No documents yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
