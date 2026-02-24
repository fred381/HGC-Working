'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuizQuestion } from '@/types'
import QuizPlayer from './quiz-player'

interface Props {
  documentId: string
  title: string
  enhancedContent: string | null
  originalContent: string | null
  alreadyRead: boolean
  quizQuestions: QuizQuestion[]
}

export default function ReadDocumentClient({
  documentId,
  title,
  enhancedContent,
  originalContent,
  alreadyRead,
  quizQuestions,
}: Props) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(alreadyRead)
  const [showModal, setShowModal] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const router = useRouter()

  const hasQuiz = quizQuestions.length > 0
  const content = showOriginal ? originalContent : (enhancedContent ?? originalContent)

  async function markRead(quizPassed?: boolean, quizScore?: number) {
    setConfirming(true)
    await fetch('/api/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, quizPassed, quizScore }),
    })
    setConfirmed(true)
    setConfirming(false)
    setShowModal(false)
    setShowQuiz(false)
    router.refresh()
  }

  function handleConfirmClick() {
    if (hasQuiz) {
      setShowQuiz(true)
    } else {
      setShowModal(true)
    }
  }

  function handleQuizPass(score: number) {
    markRead(true, score)
  }

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {enhancedContent && originalContent && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 whitespace-nowrap"
          >
            {showOriginal ? 'Show Enhanced' : 'Show Original'}
          </button>
        )}
      </div>

      {/* Document content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        {!showOriginal && enhancedContent && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">AI Enhanced</span>
          </div>
        )}
        <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {content ?? 'No content available.'}
        </div>
      </div>

      {/* Quiz */}
      {showQuiz && (
        <div className="mb-6">
          <QuizPlayer questions={quizQuestions} onPass={handleQuizPass} />
        </div>
      )}

      {/* Confirmation */}
      {!confirmed && !showQuiz && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">
            {hasQuiz ? 'Knowledge Check Required' : 'Confirm you have read this document'}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {hasQuiz
              ? 'Please answer the knowledge check questions to confirm your understanding.'
              : 'By confirming, you acknowledge that you have read and understood this document.'}
          </p>
          <button
            onClick={handleConfirmClick}
            className="w-full py-3 text-white font-semibold rounded-lg"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {hasQuiz ? 'Start Knowledge Check' : 'I have read and understood this document'}
          </button>
        </div>
      )}

      {confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-green-800">Document confirmed as read</p>
          <p className="text-sm text-green-600 mt-1">Thank you for reading this document.</p>
        </div>
      )}

      {/* Simple confirmation modal (no quiz) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Confirm Read</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you have read and fully understood <strong>{title}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => markRead()}
                disabled={confirming}
                className="flex-1 py-2.5 text-white font-semibold rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {confirming ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
