'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  generateVocabularyWords,
  generateVocabularyOptions,
  calculateScore,
  getTimeLimit,
} from '@/utils/gameUtils'

interface VocabularyWord {
  id: string
  word: string
  imageUrl?: string
}

export default function VocabularyGame() {
  const [displayedWords, setDisplayedWords] = useState<VocabularyWord[]>([])
  const [selectionOptions, setSelectionOptions] = useState<VocabularyWord[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const [showWords, setShowWords] = useState(true)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(600)
  const [totalTime, setTotalTime] = useState(0)
  const [displayTimer, setDisplayTimer] = useState(10)
  const [showDisplayTimer, setShowDisplayTimer] = useState(false)

  // Initialize game
  const initializeGame = () => {
    const words = generateVocabularyWords(difficulty)
    const options = generateVocabularyOptions(words, difficulty)
    setDisplayedWords(words)
    setSelectionOptions(options)
    setSelectedWords([])
    setShowWords(true)
    setScore(0)
    setGameStarted(true)
    setGameCompleted(false)
    setTimeRemaining(getTimeLimit('vocabulary', difficulty))
    setTotalTime(0)
    setDisplayTimer(10)
    setShowDisplayTimer(true)
  }

  // Display timer effect
  useEffect(() => {
    if (!gameStarted || !showDisplayTimer) return

    const timer = setInterval(() => {
      setDisplayTimer((prev: number) => {
        if (prev <= 1) {
          setShowWords(false)
          setShowDisplayTimer(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, showDisplayTimer])

  // Main timer effect
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

  // Handle word selection
  const handleWordClick = (word: VocabularyWord) => {
    if (showWords || selectedWords.some((w) => w.id === word.id)) return

    const isCorrect = displayedWords.some((w) => w.word === word.word)

    if (isCorrect) {
      setSelectedWords([...selectedWords, word])
      setScore(score + 10 + difficulty * 2)

      if (selectedWords.length + 1 === displayedWords.length) {
        setScore(score + 10 + difficulty * 2 + 50)
        setGameCompleted(true)
      }
    } else {
      setScore(Math.max(0, score - 10))
    }
  }

  const correctSelections = selectedWords.filter((w) =>
    displayedWords.some((dw) => dw.word === w.word),
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← กลับหน้าแรก
        </Link>
        <h1 className="game-title">📚 เกมจำศัพท์</h1>
      </div>

      {/* Game Stats */}
      <div className="w-full max-w-4xl card mb-8 bg-white">
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
            <p className="text-lg text-primary-500 mb-2">จำได้</p>
            <p className="score-display">
              {correctSelections}/{displayedWords.length}
            </p>
          </div>
          <div>
            <p className="text-lg text-primary-500 mb-2">ระดับ</p>
            <p className="score-display">{difficulty}</p>
          </div>
        </div>
      </div>

      {/* Game Area */}
      {!gameStarted ? (
        <div className="w-full max-w-4xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">
              ดูคำศัพท์ 10 วินาที แล้วเลือกคำที่เห็น
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
        <div className="w-full max-w-4xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
            <p className="text-3xl text-primary-600 mb-8">
              คุณจำศัพท์ได้สำเร็จ!
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-primary-50 p-6 rounded-xl">
                <p className="text-lg text-primary-500 mb-2">คะแนนสุดท้าย</p>
                <p className="text-5xl font-bold text-primary-700">{score}</p>
              </div>
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-warning-700">{totalTime}s</p>
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
      ) : (
        <div className="w-full max-w-4xl">
          {showDisplayTimer && (
            <div className="card text-center mb-8 bg-warning-100 border-4 border-warning-500">
              <p className="text-4xl font-bold text-warning-700 mb-4">
                จำคำศัพท์เหล่านี้ด้วย!
              </p>
              <p className="text-6xl font-bold text-warning-600 animate-bounce-gentle">
                {displayTimer}
              </p>
            </div>
          )}

          {showWords && (
            <div className="card text-center mb-8 bg-blue-50 border-4 border-primary-500">
              <p className="text-3xl font-bold text-primary-700 mb-6">คำศัพท์ที่ต้องจำ:</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {displayedWords.map((word) => (
                  <div
                    key={word.id}
                    className="bg-white px-8 py-4 rounded-xl border-2 border-primary-300 shadow-lg"
                  >
                    <p className="text-3xl font-bold text-primary-700">{word.word}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showWords && (
            <div className="card text-center mb-8 bg-green-50">
              <p className="text-3xl font-bold text-primary-700 mb-4">
                เลือกคำที่คุณจำได้
              </p>
              {correctSelections > 0 && (
                <div className="mb-6 text-2xl font-bold text-success-600">
                  ✓ จำได้ {correctSelections}/{displayedWords.length} คำ
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectionOptions.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => handleWordClick(word)}
                    disabled={selectedWords.some((w) => w.id === word.id)}
                    className={`py-4 px-4 text-2xl font-bold rounded-xl transition-all ${
                      selectedWords.some((w) => w.id === word.id)
                        ? 'btn-success opacity-70'
                        : 'btn-secondary hover:scale-105'
                    }`}
                  >
                    {word.word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-lg text-primary-600 mt-8">
        <p>เล่นเกมสม่ำเสมอเพื่อกระตุ้นสมองของคุณ</p>
      </footer>
    </div>
  )
}
