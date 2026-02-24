import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDocumentPublishedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { id, status } = await req.json()
  const supabase = await createClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If publishing, notify all carers
  if (status === 'published') {
    const { data: carers } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'carer')

    if (carers?.length) {
      await Promise.allSettled(
        carers.map((carer) =>
          sendDocumentPublishedEmail({
            to: carer.email,
            recipientName: carer.full_name ?? carer.email,
            documentTitle: doc.title,
            documentId: doc.id,
          })
        )
      )
    }
  }

  return NextResponse.json({ success: true })
}
