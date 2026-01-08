'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { generateMathQuestion, getTimeLimit } from '@/utils/gameUtils'

interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+' | '-'
  correctAnswer: number
  options: number[]
}

export default function FastMathGame() {
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  // Fixed single difficulty level
  const DIFFICULTY = 1
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const timeRef = useRef<number>(timeRemaining)
  const answerTimeoutRef = useRef<number | null>(null)
  const gameCompletedRef = useRef<boolean>(gameCompleted)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize game
  const initializeGame = () => {
    // clear any pending answer timeout when restarting
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
    }
    gameCompletedRef.current = false
    const newQuestion = generateMathQuestion(DIFFICULTY)
    setCurrentQuestion(newQuestion)
    setGameStarted(true)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTimeRemaining(getTimeLimit('fast-math', DIFFICULTY))
    setTotalTime(0)
  }

  // Start demo mode
  const startDemo = () => {
    setShowDemo(true)
    setDemoStep(0)
    const demoQuestion = generateMathQuestion(DIFFICULTY)
    setCurrentQuestion(demoQuestion)
    setGameStarted(false)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTimeRemaining(120)
    setTotalTime(0)

    // Show demo steps - slower timing for elderly users
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1) // Show math problem
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2) // Show options
        demoTimeoutRef.current = setTimeout(() => {
          setSelectedAnswer(demoQuestion.correctAnswer)
          setDemoStep(3) // Show correct answer
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4) // End demo
          }, 3000)
        }, 3000)
      }, 2000)
    }, 2000)
  }

  // Close demo
  const closeDemo = () => {
    setShowDemo(false)
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current)
      demoTimeoutRef.current = null
    }
  }

  // Load next question
  const loadNextQuestion = () => {
    // clear any lingering timeouts before loading next
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
    }

    const newQuestion = generateMathQuestion(DIFFICULTY)
    setCurrentQuestion(newQuestion)
    setSelectedAnswer(null)
    setAnswered(false)
  }

  // Handle answer
  const handleAnswer = (answer: number) => {
    if (answered) return

    setSelectedAnswer(answer)
    setAnswered(true)

    // use functional updates to avoid stale state
    setQuestionsAnswered((q) => q + 1)

    if (answer === currentQuestion?.correctAnswer) {
      setCorrectAnswers((c) => c + 1)
    }

    // clear any previous timeout
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
    }

    // schedule next question; check latest remaining time and game-completed ref to avoid stale closures
    answerTimeoutRef.current = window.setTimeout(() => {
      answerTimeoutRef.current = null
      if (gameCompletedRef.current) return
      if (timeRef.current <= 1) {
        // clear any pending timeouts and mark completed
        if (answerTimeoutRef.current) {
          clearTimeout(answerTimeoutRef.current)
          answerTimeoutRef.current = null
        }
        gameCompletedRef.current = true
        setGameCompleted(true)
      } else {
        loadNextQuestion()
      }
    }, 1500)
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev: number) => {
        if (prev <= 1) {
          // clear any pending answer timeout to avoid later callbacks
          if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current)
            answerTimeoutRef.current = null
          }
          gameCompletedRef.current = true
          setGameCompleted(true)
          return 0
        }
        return prev - 1
      })
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // keep a ref of the latest remaining time so delayed callbacks can read fresh value
  useEffect(() => {
    timeRef.current = timeRemaining
  }, [timeRemaining])

  // keep ref of gameCompleted in sync
  useEffect(() => {
    gameCompletedRef.current = gameCompleted
  }, [gameCompleted])

  // cleanup pending answer timeout when game completes/unmounts
  useEffect(() => {
    if (gameCompleted && answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = null
    }
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
        answerTimeoutRef.current = null
      }
    }
  }, [gameCompleted])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
        answerTimeoutRef.current = null
      }
    }
  }, [])

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'

  // Format seconds into MM:SS for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← กลับหน้าแรก
        </Link>
        <h1 className="game-title">🔢 เกมบวกเลข</h1>
      </div>

      <div className="w-full max-w-2xl card mb-8 bg-white">
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg text-primary-500 mb-2">เวลา</p>
              <p className="score-display">{formatTime(timeRemaining)}</p>
            </div>
            <div>
              <p className="text-lg text-primary-500 mb-2">ตอบถูก</p>
              <p className="score-display">{correctAnswers}/{questionsAnswered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      {showDemo ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8 border-4 border-success-400 bg-success-50">
            <h2 className="text-3xl font-bold text-success-600 mb-4">📖 ตัวอย่างการเล่น</h2>
            <p className="text-lg text-primary-600 mb-6">
              {demoStep === 0 && 'กำลังเตรียมตัวอย่าง...'}
              {demoStep === 1 && 'ขั้นตอนที่ 1: ดูโจทย์คณิตศาสตร์'}
              {demoStep === 2 && 'ขั้นตอนที่ 2: เลือกคำตอบที่ถูกต้อง'}
              {demoStep === 3 && 'ขั้นตอนที่ 3: คำตอบที่ถูกต้องจะถูกสีขึ้น'}
              {demoStep === 4 && 'ตัวอย่างจบแล้ว! คุณพร้อมเล่นเกมจริงแล้วหรือ?'}
            </p>

            {currentQuestion && (
              <div className="mb-6 p-6 bg-white rounded-xl">
                {demoStep >= 1 && (
                  <div className="text-5xl font-bold text-primary-700 mb-6 p-4 bg-primary-100 rounded-lg">
                    {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
                  </div>
                )}

                {demoStep >= 2 && (
                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        disabled={true}
                        className={`py-4 px-3 text-2xl font-bold rounded-lg transition-all ${
                          selectedAnswer === option
                            ? 'bg-success-400 text-white scale-110'
                            : 'bg-blue-200 text-primary-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={closeDemo} className="btn-secondary flex-1">
                ปิด
              </button>
              {demoStep === 4 && (
                <button onClick={() => { closeDemo(); initializeGame() }} className="btn-primary flex-1">
                  เริ่มเล่นเลย!
                </button>
              )}
            </div>
          </div>
        </div>
      ) : !gameStarted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            
            <div className="flex gap-4">
              <button onClick={initializeGame} className="btn-primary flex-1">
                เริ่มเล่น
              </button>
              <button onClick={startDemo} className="btn-secondary flex-1">
                ดูตัวอย่าง
              </button>
            </div>
          </div>
        </div>
      ) : gameCompleted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 เสร็จสิ้น!</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Final score removed per request */}
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2">ความถูกต้อง</p>
                <p className="text-5xl font-bold text-warning-700">{successRate}%</p>
              </div>
              <div className="bg-success-50 p-6 rounded-xl">
                <p className="text-lg text-success-600 mb-2">จำนวนคำถาม</p>
                <p className="text-5xl font-bold text-success-700">{questionsAnswered}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-lg text-blue-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-blue-700">{formatTime(totalTime)}</p>
              </div>
            </div>

            <div className="flex gap-4 flex-col md:flex-row">
              <button onClick={() => initializeGame()} className="btn-primary flex-1">
                เล่นอีกครั้ง
              </button>
              <Link href="/" className="btn-secondary flex-1 text-center">
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <div className="text-6xl font-bold text-primary-700 mb-8 p-8 bg-primary-100 rounded-2xl">
              {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
            </div>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={`py-6 px-4 text-3xl font-bold rounded-2xl transition-all ${
                    selectedAnswer === option
                      ? option === currentQuestion.correctAnswer
                        ? 'btn-success scale-110'
                        : 'btn-error scale-110'
                      : 'btn-secondary hover:scale-105'
                  } ${answered ? 'opacity-70' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer removed per request */}
    </div>
  )
}
