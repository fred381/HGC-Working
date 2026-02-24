'use client'

import { useState } from 'react'
import { DocumentWithStats, QuizQuestion } from '@/types'
import QuizEditor from './quiz-editor'

interface Props {
  documents: DocumentWithStats[]
}

export default function DocumentsManageClient({ documents: initial }: Props) {
  const [documents, setDocuments] = useState<DocumentWithStats[]>(initial)
  const [selected, setSelected] = useState<DocumentWithStats | null>(null)
  const [activeTab, setActiveTab] = useState<'enhance' | 'reads' | 'quiz'>('enhance')
  const [enhancing, setEnhancing] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  async function changeStatus(doc: DocumentWithStats, status: string) {
    const res = await fetch('/api/documents/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, status }),
    })
    if (res.ok) {
      const updated = documents.map((d) =>
        d.id === doc.id ? { ...d, status: status as DocumentWithStats['status'] } : d
      )
      setDocuments(updated)
      if (selected?.id === doc.id) setSelected({ ...selected, status: status as DocumentWithStats['status'] })
      if (status === 'published') {
        setStatusMsg('Document published and carers notified by email.')
        setTimeout(() => setStatusMsg(''), 4000)
      }
    }
  }

  async function enhance(doc: DocumentWithStats) {
    setEnhancing(true)
    setStreaming('')
    const res = await fetch('/api/enhance-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: doc.id, content: doc.original_content }),
    })
    if (!res.body) { setEnhancing(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      full += chunk
      setStreaming(full)
    }
    setEnhancing(false)
    const updated = documents.map((d) =>
      d.id === doc.id ? { ...d, enhanced_content: full } : d
    )
    setDocuments(updated)
    if (selected?.id === doc.id) setSelected({ ...selected, enhanced_content: full })
  }

  async function sendReminder(doc: DocumentWithStats) {
    setSending(true)
    await fetch('/api/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: doc.id }),
    })
    setSending(false)
    setStatusMsg('Reminder emails sent to unread carers.')
    setTimeout(() => setStatusMsg(''), 4000)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Document list */}
      <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
          <p className="text-sm font-semibold text-slate-700">All Documents</p>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelected(doc); setStreaming('') }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                selected?.id === doc.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  doc.status === 'published' ? 'bg-green-100 text-green-700'
                    : doc.status === 'archived' ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {doc.status}
                </span>
                {doc.read_count !== undefined && doc.total_carers !== undefined && (
                  <span className="text-xs text-slate-400">{doc.read_count}/{doc.total_carers} read</span>
                )}
              </div>
            </button>
          ))}
          {!documents.length && (
            <p className="text-sm text-slate-400 px-4 py-6 text-center">No documents yet.</p>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a document to manage it
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{selected.title}</h2>
                  {selected.review_date && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review: {new Date(selected.review_date).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected.status === 'draft' && (
                    <button
                      onClick={() => changeStatus(selected, 'published')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                  {selected.status === 'published' && (
                    <>
                      <button
                        onClick={() => sendReminder(selected)}
                        disabled={sending}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50"
                      >
                        {sending ? 'Sending…' : 'Send Reminder'}
                      </button>
                      <button
                        onClick={() => changeStatus(selected, 'archived')}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                      >
                        Archive
                      </button>
                    </>
                  )}
                  {selected.status === 'archived' && (
                    <button
                      onClick={() => changeStatus(selected, 'draft')}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                    >
                      Restore to Draft
                    </button>
                  )}
                </div>
              </div>

              {statusMsg && (
                <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
                  {statusMsg}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-4 mt-4">
                {(['enhance', 'reads', 'quiz'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm pb-1 font-medium capitalize border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'enhance' ? 'AI Enhancement' : tab === 'reads' ? 'Read Tracking' : 'Quiz'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'enhance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {selected.enhanced_content
                        ? 'Enhanced version available. You can re-enhance to update it.'
                        : 'No enhanced version yet. Click below to enhance with AI.'}
                    </p>
                    <button
                      onClick={() => enhance(selected)}
                      disabled={enhancing || !selected.original_content}
                      className="px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                      style={{ backgroundColor: '#1e3a5f' }}
                    >
                      {enhancing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enhancing…
                        </>
                      ) : 'Enhance with AI'}
                    </button>
                  </div>

                  {(streaming || selected.enhanced_content) && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Enhanced Version</p>
                      <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap text-sm">
                        {streaming || selected.enhanced_content}
                      </div>
                    </div>
                  )}

                  {selected.original_content && (
                    <details className="border border-slate-200 rounded-lg">
                      <summary className="px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50">
                        View Original
                      </summary>
                      <div className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-wrap">
                        {selected.original_content}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {activeTab === 'reads' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: selected.total_carers
                            ? `${((selected.read_count ?? 0) / selected.total_carers) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      {selected.read_count ?? 0} / {selected.total_carers ?? 0} read
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'quiz' && (
                <QuizEditor
                  documentId={selected.id}
                  initialQuestions={selected.quiz_questions ?? []}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
