import { createClient } from '@/lib/supabase/server'

export default async function UsersPage() {
  const supabase = await createClient()

  const [{ data: carers }, { data: docs }, { data: reads }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'carer').order('full_name'),
    supabase.from('documents').select('id').eq('status', 'published'),
    supabase.from('document_reads').select('user_id'),
  ])

  const publishedCount = docs?.length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-slate-500 mt-1">Carer accounts and compliance overview</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {carers?.length ?? 0} carer{carers?.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-400">{publishedCount} published documents</p>
        </div>
        <div className="divide-y divide-slate-100">
          {(carers ?? []).map((carer) => {
            const carerReads = (reads ?? []).filter((r) => r.user_id === carer.id).length
            const pct = publishedCount > 0 ? Math.round((carerReads / publishedCount) * 100) : 0
            return (
              <div key={carer.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{carer.full_name ?? 'No name'}</p>
                    <p className="text-xs text-slate-400">{carer.email}</p>
                  </div>
                  <span className={`text-sm font-semibold ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{carerReads}/{publishedCount}</span>
                </div>
              </div>
            )
          })}
          {!carers?.length && (
            <p className="text-sm text-slate-400 px-6 py-8 text-center">No carers yet. They will appear once they sign up.</p>
          )}
        </div>
      </div>
    </div>
  )
}
