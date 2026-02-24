import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { documentId, content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `You are helping a care business called Hamilton George Care improve their policy and procedure documents.

Please rewrite the following document to make it clearer, better structured, and easier to understand for care workers.

Guidelines:
- Use clear, plain English — avoid jargon
- Break content into logical sections with headings
- Use bullet points and numbered lists where appropriate
- Keep all the important information — don't remove anything critical
- Make the tone professional but accessible
- Format it well with clear structure

Original document:
---
${content}
---

Please provide the enhanced version directly, without any introduction or preamble.`,
          },
        ],
      })

      for await (const event of response) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text
          fullText += text
          controller.enqueue(encoder.encode(text))
        }
      }

      // Save to database
      const supabase = await createClient()
      await supabase
        .from('documents')
        .update({ enhanced_content: fullText })
        .eq('id', documentId)

      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
