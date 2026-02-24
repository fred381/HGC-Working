import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDocumentPublishedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { documentId, documentTitle } = await req.json()
  const supabase = await createClient()

  const { data: carers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'carer')

  if (!carers?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const results = await Promise.allSettled(
    carers.map((carer) =>
      sendDocumentPublishedEmail({
        to: carer.email,
        recipientName: carer.full_name ?? carer.email,
        documentTitle,
        documentId,
      })
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: carers.length })
}
