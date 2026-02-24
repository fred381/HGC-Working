'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuizQuestion } from '@/types'

interface QuizEditorProps {
  documentId: string
  initialQuestions: QuizQuestion[]
}

export default function QuizEditor({ documentId, initialQuestions }: QuizEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  function addQuestion() {
    const newQ: QuizQuestion = {
      id: `new-${Date.now()}`,
      document_id: documentId,
      question: '',
      options: ['', '', '', ''],
      correct_index: 0,
      order_index: questions.length,
    }
    setQuestions([...questions, newQ])
  }

  function updateQuestion(index: number, field: keyof QuizQuestion, value: unknown) {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const updated = [...questions]
    const opts = [...updated[qIndex].options]
    opts[oIndex] = value
    updated[qIndex] = { ...updated[qIndex], options: opts }
    setQuestions(updated)
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  async function saveQuiz() {
    setSaving(true)
    // Delete existing and re-insert
    await supabase.from('quiz_questions').delete().eq('document_id', documentId)

    if (questions.length > 0) {
      const toInsert = questions.map((q, i) => ({
        document_id: documentId,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        order_index: i,
      }))
      await supabase.from('quiz_questions').insert(toInsert)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {questions.length === 0
            ? 'No questions yet. Add questions carers must answer correctly before confirming they have read this document.'
            : `${questions.length} question${questions.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={saveQuiz}
          disabled={saving}
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Quiz'}
        </button>
      </div>

      {questions.map((q, qIndex) => (
        <div key={q.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <div className="flex items-start justify-between gap-3 mb-3">
            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
              placeholder={`Question ${qIndex + 1}`}
              rows={2}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={() => removeQuestion(qIndex)}
              className="text-slate-400 hover:text-red-500 p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.correct_index === oIndex}
                  onChange={() => updateQuestion(qIndex, 'correct_index', oIndex)}
                  className="accent-green-600"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  placeholder={`Option ${oIndex + 1}`}
                  className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    q.correct_index === oIndex ? 'border-green-300' : 'border-slate-300'
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Select the radio button next to the correct answer.</p>
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
      >
        + Add Question
      </button>
    </div>
  )
}
