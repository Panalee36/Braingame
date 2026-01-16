'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');

  const [displayedWords, setDisplayedWords] = useState<VocabularyWord[]>([])
  const [selectionOptions, setSelectionOptions] = useState<VocabularyWord[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const [showWords, setShowWords] = useState(true)
  const [difficulty, setDifficulty] = useState(1)
  const [difficultyChoice, setDifficultyChoice] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
    setDifficulty(level)
    const previewSeconds = level === 1 ? 75 : 90
    const playLimit = level === 1 ? 90 : 105
    setTimeLimit(Math.min(playLimit, getTimeLimit('vocabulary', level)))
    setCorrectCount(null)
    setDisplayTimer(previewSeconds)
    setShowDisplayTimer(true)
  }

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame(levelFromQuery);
    }
  }, [isDailyMode, levelFromQuery]);

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
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1)
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2)
        demoTimeoutRef.current = setTimeout(() => {
          setShowWords(false)
          setDemoStep(3)
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4)
          }, 4000)
        }, 4000)
      }, 3000)
    }, 2000)
  }

  const closeDemo = () => {
    setShowDemo(false)
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current)
      demoTimeoutRef.current = null
    }
  }

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

  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return
    const timer = setInterval(() => { setTotalTime((prev: number) => prev + 1) }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted, showDisplayTimer])

  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return
    if (totalTime >= timeLimit) {
      const correct = selectedWords.filter((w) => displayedWords.some((dw) => dw.word === w.word)).length
      setCorrectCount(correct)
      setGameCompleted(true)
    }
  }, [totalTime, timeLimit, gameStarted, gameCompleted, showDisplayTimer, selectedWords, displayedWords])

  const handleWordClick = (word: VocabularyWord) => {
    if (!gameStarted || showWords || gameCompleted) return
    const maxSelections = displayedWords.length
    setSelectedWords((prev) => {
      const exists = prev.some((w) => w.id === word.id)
      let next: VocabularyWord[]
      if (exists) {
        next = prev.filter((w) => w.id !== word.id)
      } else {
        if (prev.length >= maxSelections) return prev
        next = [...prev, word]
      }
      if (next.length >= maxSelections) {
        const correct = next.filter((w) => displayedWords.some((dw) => dw.word === w.word)).length
        setCorrectCount(correct)
        setGameCompleted(true)
      }
      return next
    })
  }

  if (isDailyMode && !gameStarted && !gameCompleted) {
    return <div className="p-10 text-center text-blue-600 font-bold animate-pulse">กำลังเตรียมเกมจำศัพท์...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-white shadow-sm py-6 sticky top-0 z-50 mb-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center relative">
          {!isDailyMode ? (
              <Link href="/welcome" className="absolute left-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 text-white font-black text-lg border-2 border-blue-400"><span>←</span> กลับหน้าแรก</Link>
          ) : (
              <div className="absolute left-6 px-5 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-bold border border-yellow-200 shadow-sm">📅 ภารกิจประจำวัน</div>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-blue-900 tracking-tight">📚 เกมจำศัพท์</h1>
          <button onClick={() => startDemo(difficultyChoice || 1)} className="absolute right-6 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 font-black text-4xl border-2 border-yellow-200">💡</button>
        </div>
      </div>

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

      {showDemo ? (
        <div className="w-full max-w-4xl">
           <div className="card text-center mb-8 border-4 border-success-400 bg-success-50">
             <h2 className="text-3xl font-bold text-success-600 mb-4">📖 ตัวอย่างการเล่น</h2>
             <button onClick={closeDemo} className="btn-secondary">ปิด</button>
           </div>
        </div>
      ) : !gameStarted ? (
        <div className="w-full max-w-6xl">
          <div className="card text-center mb-8 py-24 px-16">
            <h2 className="text-6xl font-black text-primary-700 mb-12">ยินดีต้อนรับ!</h2>
            <div className="flex gap-6 flex-col md:flex-row mb-10 items-center">
              <button onClick={() => setDifficultyChoice(1)} className={`flex-1 w-full py-8 text-3xl font-black rounded-xl border-2 transition-all ${difficultyChoice === 1 ? 'bg-blue-600 text-white' : 'bg-white text-primary-700'}`}>ธรรมดา</button>
              <button onClick={() => setDifficultyChoice(2)} className={`flex-1 w-full py-8 text-3xl font-black rounded-xl border-2 transition-all ${difficultyChoice === 2 ? 'bg-cyan-600 text-white' : 'bg-white text-primary-700'}`}>ยาก</button>
            </div>
            <button onClick={() => difficultyChoice && initializeGame(difficultyChoice)} disabled={difficultyChoice === null} className="btn-primary w-full py-6 text-2xl">เริ่มเล่นเลย</button>
          </div>
        </div>
      ) : gameCompleted ? (
        <div className="w-full max-w-4xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-primary-50 p-6 rounded-xl"><p className="text-lg text-primary-500 mb-2">ผลการเล่น</p><p className="text-4xl font-bold text-primary-700">{correctCount !== null ? `${correctCount}/${displayedWords.length} คำ` : `0/${displayedWords.length} คำ`}</p></div>
              <div className="bg-warning-50 p-6 rounded-xl"><p className="text-lg text-warning-600 mb-2">ใช้เวลา</p><p className="text-5xl font-bold text-warning-700">{formatTime(totalTime)}</p></div>
            </div>

            {isDailyMode ? (
               <button 
                 onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                 className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
               >
                 ✅ ผ่านด่าน (ไปต่อ)
               </button>
            ) : (
               <div className="flex gap-4 flex-col md:flex-row">
                  <button onClick={() => initializeGame()} className="btn-primary flex-1">เล่นอีกครั้ง</button>
                  <Link href="/welcome" className="btn-secondary flex-1 text-center">กลับหน้าแรก</Link>
               </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl">
          {showDisplayTimer && (
            <div className="card text-center mb-8 bg-warning-100 border-4 border-warning-500">
              <p className="text-4xl font-bold text-warning-700 mb-4">จำคำศัพท์เหล่านี้ด้วย!</p>
              <p className="text-6xl font-bold text-warning-600 animate-bounce-gentle">{formatTime(displayTimer)}</p>
            </div>
          )}
          {showWords ? (
            <div className="card text-center mb-8 bg-blue-50 border-4 border-primary-500 p-8 w-full max-w-screen-xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {displayedWords.map((word) => (
                  <div key={word.id} className="bg-white py-4 rounded-xl border-2 border-primary-300 shadow-lg"><p className="text-xl font-bold text-primary-700">{word.word}</p></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center mb-8 bg-green-50 border-4 border-primary-200 p-10 w-full max-w-screen-xl mx-auto rounded-2xl">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {selectionOptions.map((word) => {
                  const isSelected = selectedWords.some((w) => w.id === word.id)
                  return (
                    <button key={word.id} onClick={() => handleWordClick(word)} className={`p-3 text-xl font-bold rounded-2xl transition-all ${isSelected ? 'btn-success' : 'bg-white border-2 border-primary-200 shadow-lg hover:scale-105'}`}>{word.word}</button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}