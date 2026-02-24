import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { documentId, quizPassed, quizScore } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { error } = await supabase.from('document_reads').upsert(
    {
      document_id: documentId,
      user_id: user.id,
      read_at: new Date().toISOString(),
      quiz_passed: quizPassed ?? null,
      quiz_score: quizScore ?? null,
    },
    { onConflict: 'document_id,user_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
