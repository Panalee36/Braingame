'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateMathQuestion, calculateScore, getTimeLimit } from '@/utils/gameUtils'

interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+'
  correctAnswer: number
  options: number[]
}

export default function FastMathGame() {
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  // Initialize game
  const initializeGame = () => {
    const newQuestion = generateMathQuestion(difficulty)
    setCurrentQuestion(newQuestion)
    setScore(0)
    setGameStarted(true)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTimeRemaining(getTimeLimit('fast-math', difficulty))
    setTotalTime(0)
  }

  // Load next question
  const loadNextQuestion = () => {
    const newQuestion = generateMathQuestion(difficulty)
    setCurrentQuestion(newQuestion)
    setSelectedAnswer(null)
    setAnswered(false)
  }

  // Handle answer
  const handleAnswer = (answer: number) => {
    if (answered) return

    setSelectedAnswer(answer)
    setAnswered(true)
    setQuestionsAnswered(questionsAnswered + 1)

    if (answer === currentQuestion?.correctAnswer) {
      setCorrectAnswers(correctAnswers + 1)
      setScore(score + 10 + difficulty * 2)
    }

    setTimeout(() => {
      if (timeRemaining > 10) {
        loadNextQuestion()
      } else {
        setGameCompleted(true)
      }
    }, 1500)
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev: number) => {
        if (prev <= 1) {
          setGameCompleted(true)
          return 0
        }
        return prev - 1
      })
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← กลับหน้าแรก
        </Link>
        <h1 className="game-title">🔢 เกมบวกเลข</h1>
      </div>

      {/* Game Stats */}
      <div className="w-full max-w-2xl card mb-8 bg-white">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg text-primary-500 mb-2">คะแนน</p>
            <p className="score-display">{score}</p>
          </div>
          <div>
            <p className="text-lg text-primary-500 mb-2">เวลา</p>
            <p className="score-display">{timeRemaining}s</p>
          </div>
          <div>
            <p className="text-lg text-primary-500 mb-2">ตอบถูก</p>
            <p className="score-display">{correctAnswers}/{questionsAnswered}</p>
          </div>
          <div>
            <p className="text-lg text-primary-500 mb-2">ระดับ</p>
            <p className="score-display">{difficulty}</p>
          </div>
        </div>
      </div>

      {/* Game Area */}
      {!gameStarted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">
              เลือกระดับความยาก เพื่อเริ่มเล่น
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-4 px-3 text-2xl font-bold rounded-xl transition-all ${
                    difficulty === level
                      ? 'btn-success'
                      : 'btn-secondary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button onClick={initializeGame} className="btn-primary w-full">
              เริ่มเล่น
            </button>
          </div>
        </div>
      ) : gameCompleted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 เสร็จสิ้น!</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-primary-50 p-6 rounded-xl">
                <p className="text-lg text-primary-500 mb-2">คะแนนสุดท้าย</p>
                <p className="text-5xl font-bold text-primary-700">{score}</p>
              </div>
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
                <p className="text-5xl font-bold text-blue-700">{totalTime}s</p>
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

      {/* Footer */}
      <footer className="text-center text-lg text-primary-600 mt-8">
        <p>เล่นเกมสม่ำเสมอเพื่อกระตุ้นสมองของคุณ</p>
      </footer>
    </div>
  )
}
