'use client'

import { useState } from 'react'
import { QuizQuestion } from '@/types'

interface QuizPlayerProps {
  questions: QuizQuestion[]
  onPass: (score: number) => void
}

export default function QuizPlayer({ questions, onPass }: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})

  function selectAnswer(questionId: string, optionIndex: number) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  function submit() {
    const newResults: Record<string, boolean> = {}
    let correct = 0
    questions.forEach((q) => {
      const isCorrect = answers[q.id] === q.correct_index
      newResults[q.id] = isCorrect
      if (isCorrect) correct++
    })
    setResults(newResults)
    setSubmitted(true)

    const allPassed = correct === questions.length
    if (allPassed) {
      setTimeout(() => onPass(correct), 1000)
    }
  }

  function retry() {
    setAnswers({})
    setResults({})
    setSubmitted(false)
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)
  const allPassed = submitted && questions.every((q) => results[q.id])
  const score = Object.values(results).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm font-medium">Knowledge Check</p>
        <p className="text-blue-700 text-sm mt-1">
          Answer all questions correctly to confirm you have understood this document.
        </p>
      </div>

      {questions.map((q, index) => (
        <div key={q.id} className={`rounded-lg border p-4 ${
          submitted
            ? results[q.id] ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
            : 'border-slate-200 bg-white'
        }`}>
          <p className="font-medium text-slate-900 text-sm mb-3">
            {index + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oIndex) => {
              const isSelected = answers[q.id] === oIndex
              const isCorrect = q.correct_index === oIndex
              let optStyle = 'border-slate-200 bg-white'

              if (submitted) {
                if (isCorrect) optStyle = 'border-green-400 bg-green-100'
                else if (isSelected && !isCorrect) optStyle = 'border-red-400 bg-red-100'
              } else if (isSelected) {
                optStyle = 'border-blue-400 bg-blue-50'
              }

              return (
                <button
                  key={oIndex}
                  onClick={() => selectAnswer(q.id, oIndex)}
                  disabled={submitted}
                  className={`w-full text-left px-3 py-2.5 border rounded-lg text-sm transition-colors ${optStyle} ${
                    !submitted ? 'hover:border-slate-300 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="w-full py-3 text-white font-semibold rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          Submit Answers
        </button>
      )}

      {submitted && !allPassed && (
        <div className="text-center">
          <p className="text-red-700 font-medium mb-2">
            You got {score} of {questions.length} correct. All answers must be correct.
          </p>
          <button
            onClick={retry}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Try Again
          </button>
        </div>
      )}

      {allPassed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold">All correct! Marking as read…</p>
        </div>
      )}
    </div>
  )
}
