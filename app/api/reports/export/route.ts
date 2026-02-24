import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const [{ data: carers }, { data: docs }, { data: reads }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'carer').order('full_name'),
    supabase.from('documents').select('*').eq('status', 'published').order('title'),
    supabase.from('document_reads').select('*'),
  ])

  const rows: string[] = [
    ['Carer Name', 'Carer Email', 'Document', 'Read', 'Read Date', 'Quiz Passed', 'Quiz Score'].join(','),
  ]

  for (const carer of (carers ?? [])) {
    for (const doc of (docs ?? [])) {
      const read = (reads ?? []).find(
        (r) => r.user_id === carer.id && r.document_id === doc.id
      )
      rows.push(
        [
          `"${carer.full_name ?? ''}"`,
          `"${carer.email}"`,
          `"${doc.title}"`,
          read ? 'Yes' : 'No',
          read ? new Date(read.read_at).toLocaleDateString('en-GB') : '',
          read?.quiz_passed != null ? (read.quiz_passed ? 'Yes' : 'No') : 'N/A',
          read?.quiz_score != null ? String(read.quiz_score) : 'N/A',
        ].join(',')
      )
    }
  }

  const csv = rows.join('\n')
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="compliance-report-${date}.csv"`,
    },
  })
}
