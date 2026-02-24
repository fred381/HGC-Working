'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewDocumentPage() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [reviewDate, setReviewDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) return
    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to storage
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Extract text
      const formData = new FormData()
      formData.append('file', file)
      const extractRes = await fetch('/api/extract-text', { method: 'POST', body: formData })
      const { text } = await extractRes.json()

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          title,
          original_content: text,
          file_url: publicUrl,
          file_name: file.name,
          review_date: reviewDate || null,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single()

      if (docError) throw docError

      router.push(`/admin/documents?highlight=${doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-1">Upload a policy or procedure document to the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Medication Administration Policy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Document File</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-600">
                {file ? file.name : <><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</>}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT</p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Review Date (optional)</label>
          <input
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">When this document should next be reviewed and updated.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file || !title}
            className="flex-1 py-2.5 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  )
}
