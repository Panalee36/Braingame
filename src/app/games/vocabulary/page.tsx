'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  generateVocabularyWords,
  generateVocabularyOptions,
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
  const [difficulty, setDifficulty] = useState(1)
  // Choice on the welcome screen before starting
  const [difficultyChoice, setDifficultyChoice] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  // elapsed seconds since the preview ended (play time)
  const [totalTime, setTotalTime] = useState(0)
  // hard cap the actual play time to 90s for this game
  const [timeLimit, setTimeLimit] = useState(90)
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [displayTimer, setDisplayTimer] = useState(10)
  const [showDisplayTimer, setShowDisplayTimer] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const mm = mins.toString().padStart(2, '0')
    const ss = secs.toString().padStart(2, '0')
    return ${mm}:${ss}
  }

  // Initialize game
  const initializeGame = (level: number = difficulty) => {
    const words = generateVocabularyWords(level)
    const options = generateVocabularyOptions(words, level)
    setDisplayedWords(words)
    setSelectionOptions(options)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(true)
    setGameCompleted(false)
    setTotalTime(0)
    // Persist difficulty selection
    setDifficulty(level)
    // Preview (memorization) time depends on difficulty
    const previewSeconds = level === 1 ? 75 : 90
    // Play time limit depends on difficulty
    const playLimit = level === 1 ? 90 : 105
    // Use global util but cap by chosen limit
    setTimeLimit(Math.min(playLimit, getTimeLimit('vocabulary', level)))
    setCorrectCount(null)
    setDisplayTimer(previewSeconds)
    setShowDisplayTimer(true)
  }

  // Start demo mode
  const startDemo = (level: number = 1) => {
    setShowDemo(true)
    setDemoStep(0)
    const demoWords = generateVocabularyWords(level)
    const demoOptions = generateVocabularyOptions(demoWords, level)
    setDisplayedWords(demoWords)
    setSelectionOptions(demoOptions)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(false)
    setGameCompleted(false)
    setTotalTime(0)
    setCorrectCount(null)
    setDifficulty(level)

    // Show demo steps - slower timing for elderly users
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1) // Show display timer
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2) // Show words to remember
        demoTimeoutRef.current = setTimeout(() => {
          setShowWords(false)
          setDemoStep(3) // Show selection area
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4) // End demo
          }, 4000)
        }, 4000)
      }, 3000)
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

  // Main timer effect: start counting only after preview finishes
  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return

    const timer = setInterval(() => {
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted, showDisplayTimer])

  // End game automatically when time runs out
  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return
    if (totalTime >= timeLimit) {
      const correct = selectedWords.filter((w) =>
        displayedWords.some((dw) => dw.word === w.word)
      ).length
      setCorrectCount(correct)
      setGameCompleted(true)
    }
  }, [totalTime, timeLimit, gameStarted, gameCompleted, showDisplayTimer, selectedWords, displayedWords])

  // Handle word selection
  const handleWordClick = (word: VocabularyWord) => {
    // Don't allow interaction during preview, before start, or after completion
    if (!gameStarted || showWords || gameCompleted) return

    const maxSelections = displayedWords.length

    setSelectedWords((prev) => {
      const exists = prev.some((w) => w.id === word.id)
      let next: VocabularyWord[]

      if (exists) {
        // toggle off
        next = prev.filter((w) => w.id !== word.id)
      } else {
        // add only if we haven't reached the max
        if (prev.length >= maxSelections) return prev
        next = [...prev, word]
      }

      // if after the update we've reached the required number, compute result
      if (next.length >= maxSelections) {
        const correct = next.filter((w) => displayedWords.some((dw) => dw.word === w.word)).length
        setCorrectCount(correct)
        setGameCompleted(true)
      }

      return next
    })
  }

  // Note: correctSelections UI removed per request

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header Tab */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-white shadow-sm py-6 sticky top-0 z-50 mb-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center relative">
          <Link 
            href="/welcome" 
            className="absolute left-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 text-white font-black text-lg border-2 border-blue-400"
          >
            <span>←</span> กลับหน้าแรก
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight">
            📚 เกมจำศัพท์
          </h1>
          <button
            onClick={() => startDemo(difficultyChoice || 1)}
            className="absolute right-6 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 font-black text-4xl border-2 border-yellow-200"
          >
            💡
          </button>
        </div>
      </div>
      {/* Top stats bar - Two cards side by side */}
      {gameStarted && !gameCompleted && !showDisplayTimer && (
        <div className="sticky top-4 z-40 w-full max-w-4xl mb-8 mx-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">เวลาที่เหลือ</p>
              <p className="text-6xl font-black text-blue-600 tabular-nums">{formatTime(Math.max(timeLimit - totalTime, 0))}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">จำได้แล้ว</p>
              <p className="text-6xl font-black text-cyan-600 tabular-nums">{selectedWords.length}/{displayedWords.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      {showDemo ? (
        <div className="w-full max-w-4xl">
          <div className="card text-center mb-8 border-4 border-success-400 bg-success-50">
            <h2 className="text-3xl font-bold text-success-600 mb-4">📖 ตัวอย่างการเล่น</h2>
            <p className="text-lg text-primary-600 mb-6">
              {demoStep === 0 && 'กำลังเตรียมตัวอย่าง...'}
              {demoStep === 1 && `ขั้นตอนที่ 1: เกมจะแสดงเวลาจำศัพท์ ${difficulty === 1 ? '1 นาที 15 วินาที' : '1 นาที 30 วินาที'}`}
              {demoStep === 2 && 'ขั้นตอนที่ 2: ดูคำศัพท์เหล่านี้และจำให้ได้'}
              {demoStep === 3 && 'ขั้นตอนที่ 3: เลือกคำศัพท์ที่คุณจำได้'}
              {demoStep === 4 && 'ตัวอย่างจบแล้ว! คุณพร้อมเล่นเกมจริงแล้วหรือ?'}
            </p>

            <div className="mb-6 p-6 bg-white rounded-xl">
              {demoStep >= 1 && (
                <p className="text-2xl font-bold text-warning-700">⏱️ นับถอยหลัง {difficulty === 1 ? '1 นาที 15 วินาที' : '1 นาที 30 วินาที'}...</p>
              )}
              {demoStep >= 2 && (
                <div className="mt-4">
                  <p className="text-lg font-bold text-primary-600 mb-3">คำศัพท์ที่ต้องจำ:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {displayedWords.slice(0, 3).map((word) => (
                      <div key={word.id} className="bg-primary-100 py-3 rounded-lg">
                        <p className="text-lg font-bold text-primary-700">{word.word}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {demoStep >= 3 && (
                <div className="mt-4">
                  <p className="text-lg font-bold text-primary-600 mb-3">เลือกคำศัพท์ที่เห็น:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectionOptions.slice(0, 3).map((word) => (
                      <button key={word.id} disabled className="bg-white border-2 border-primary-300 py-3 rounded-lg font-bold text-primary-600">
                        {word.word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={closeDemo} className="btn-secondary flex-1">
                ปิด
              </button>
              {demoStep === 4 && (
                <button onClick={() => { closeDemo(); initializeGame(difficulty) }} className="btn-primary flex-1">
                  เริ่มเล่นเลย!
                </button>
              )}
            </div>
          </div>
        </div>
      ) : !gameStarted ? (
        <div className="w-full max-w-6xl">
          <div className="card text-center mb-8 py-24 px-16">
            <h2 className="text-6xl font-black text-primary-700 mb-12">ยินดีต้อนรับ!</h2>
            <p className="text-4xl text-primary-600 mb-12">
              ดูคำศัพท์ {difficultyChoice === 2 ? '1 นาที 30 วินาที' : '1 นาที 15 วินาที'} แล้วเลือกคำที่เห็น
            </p>

            <p className="text-2xl text-primary-500 mb-8">เลือกระดับความยาก</p>
            <div className="flex gap-6 flex-col md:flex-row mb-10 items-center">
              <button
                onClick={() => setDifficultyChoice(1)}
                className={`flex-1 w-full py-8 text-3xl font-black rounded-xl border-2 transition-all ${
                  difficultyChoice === 1
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg scale-[1.02]'
                    : 'bg-white text-primary-700 border-primary-300 hover:scale-105'
                }`}
              >
                ธรรมดา
              </button>
              <button
                onClick={() => setDifficultyChoice(2)}
                className={`flex-1 w-full py-8 text-3xl font-black rounded-xl border-2 transition-all ${
                  difficultyChoice === 2
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg scale-[1.02]'
                    : 'bg-white text-primary-700 border-primary-300 hover:scale-105'
                }`}
              >
                ยาก
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => difficultyChoice && initializeGame(difficultyChoice)}
                disabled={difficultyChoice === null}
                className={`flex-1 py-6 text-2xl font-black rounded-xl ${
                  difficultyChoice === null ? 'btn-disabled' : 'btn-primary'
                }`}
              >
                เริ่มเล่นเลย
              </button>
            </div>
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
                <p className="text-lg text-primary-500 mb-2">ผลการเล่น</p>
                <p className="text-4xl font-bold text-primary-700">
                  {correctCount !== null ? ${correctCount}/${displayedWords.length} คำ : `0/${displayedWords.length} คำ`}
                </p>
              </div>
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-warning-700">{formatTime(totalTime)}</p>
              </div>
            </div>

            <div className="flex gap-4 flex-col md:flex-row">
              <button onClick={() => initializeGame()} className="btn-primary flex-1">
                เล่นอีกครั้ง
              </button>
              <Link href="/welcome" className="btn-secondary flex-1 text-center">
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl">
          {showDisplayTimer && (
            <div className="card text-center mb-8 bg-warning-100 border-4 border-warning-500">
              <p className="text-4xl font-bold text-warning-700 mb-4">
                จำคำศัพท์เหล่านี้ด้วย!
              </p>
              <p className="text-6xl font-bold text-warning-600 animate-bounce-gentle">
                {formatTime(displayTimer)}
              </p>
            </div>
          )}

          {showWords && (
            <div className="card text-center mb-8 bg-blue-50 border-4 border-primary-500 p-8 w-full max-w-screen-xl mx-auto">
              <p className="text-2xl md:text-3xl font-bold text-primary-700 mb-4">คำศัพท์ที่ต้องจำ:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4 justify-items-center">
                {displayedWords.map((word) => (
                  <div
                    key={word.id}
                    className="bg-white w-full py-4 md:py-6 rounded-xl border-2 border-primary-300 shadow-lg flex items-center justify-center overflow-hidden min-h-[100px]"
                  >
                    <p className="text-xl md:text-2xl font-bold text-primary-700 text-center whitespace-normal px-3">{word.word}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showWords && (
            <div className="card text-center mb-8 bg-green-50 border-4 border-primary-200 p-10 w-full max-w-screen-xl mx-auto rounded-2xl">
              <p className="text-4xl font-bold text-primary-700 mb-6">เลือกคำที่คุณจำได้</p>
              {/* Selection grid styled to match provided layout: larger tiles, more spacing */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {selectionOptions.map((word) => {
                  const isSelected = selectedWords.some((w) => w.id === word.id)
                  return (
                    <button
                      key={word.id}
                      onClick={() => handleWordClick(word)}
                      disabled={gameCompleted || !gameStarted || showWords}
                      className={`w-full min-h-[80px] md:min-h-[100px] py-3 px-4 text-lg md:text-xl font-bold rounded-2xl transition-all flex items-center justify-center text-center whitespace-nowrap overflow-hidden ${
                        isSelected ? 'btn-success opacity-80' : 'bg-white border-2 border-primary-200 shadow-lg hover:scale-105'
                      }`}
                    >
                      {word.word}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer removed per request */}
    </div>
  )
}