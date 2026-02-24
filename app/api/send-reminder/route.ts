import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { documentId } = await req.json()
  const supabase = await createClient()

  const [{ data: doc }, { data: carers }, { data: reads }] = await Promise.all([
    supabase.from('documents').select('title').eq('id', documentId).single(),
    supabase.from('profiles').select('id, email, full_name').eq('role', 'carer'),
    supabase.from('document_reads').select('user_id').eq('document_id', documentId),
  ])

  const readUserIds = new Set((reads ?? []).map((r) => r.user_id))
  const unread = (carers ?? []).filter((c) => !readUserIds.has(c.id))

  if (!unread.length) {
    return NextResponse.json({ sent: 0 })
  }

  const results = await Promise.allSettled(
    unread.map((carer) =>
      sendReminderEmail({
        to: carer.email,
        recipientName: carer.full_name ?? carer.email,
        documentTitle: doc?.title ?? 'Document',
        documentId,
      })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: unread.length })
}
