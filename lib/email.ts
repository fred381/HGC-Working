import { Resend } from 'resend'

const FROM = 'Hamilton George Care <noreply@hamiltongeorgecare.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendDocumentPublishedEmail(params: {
  to: string
  recipientName: string
  documentTitle: string
  documentId: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { to, recipientName, documentTitle, documentId } = params
  const url = `${APP_URL}/carer/documents/${documentId}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New Policy Published: ${documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0">
          <h1 style="color:#ffffff;margin:0;font-size:20px">Hamilton George Care</h1>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Policy &amp; Procedure Platform</p>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Hi ${recipientName},</p>
          <p style="margin:0 0 16px">A new policy has been published that requires your attention:</p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:0 0 24px">
            <p style="margin:0;font-weight:600;font-size:16px">${documentTitle}</p>
          </div>
          <p style="margin:0 0 24px">Please read and confirm you have understood this document at your earliest opportunity.</p>
          <a href="${url}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">
            Read Document
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#64748b">
            Hamilton George Care &bull; Policy Management Platform
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendReminderEmail(params: {
  to: string
  recipientName: string
  documentTitle: string
  documentId: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { to, recipientName, documentTitle, documentId } = params
  const url = `${APP_URL}/carer/documents/${documentId}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: Please read "${documentTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1e3a5f;padding:20px 24px;border-radius:8px 8px 0 0">
          <h1 style="color:#ffffff;margin:0;font-size:20px">Hamilton George Care</h1>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Policy &amp; Procedure Platform</p>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Hi ${recipientName},</p>
          <p style="margin:0 0 16px">This is a friendly reminder that you have not yet read the following document:</p>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:16px;margin:0 0 24px">
            <p style="margin:0;font-weight:600;font-size:16px">${documentTitle}</p>
          </div>
          <p style="margin:0 0 24px">Please take a moment to read and confirm your understanding of this document.</p>
          <a href="${url}" style="background:#1e3a5f;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">
            Read Now
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#64748b">
            Hamilton George Care &bull; Policy Management Platform
          </p>
        </div>
      </div>
    `,
  })
}
