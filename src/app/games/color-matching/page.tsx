'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { generateColorCards } from '@/utils/gameUtils'

interface ColorCard {
  id: string
  color: string
  colorName?: string
  shape?: string
  isFlipped: boolean
  isMatched: boolean
}

export default function ColorMatchingGame() {
  const [cards, setCards] = useState<ColorCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [difficultyChoice, setDifficultyChoice] = useState<number | null>(null)
  const [mode, setMode] = useState<'pair' | 'shape' | 'selective'>('pair')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [targetColor, setTargetColor] = useState<string | null>(null)
  const [targetCount, setTargetCount] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [moves, setMoves] = useState(0)
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize game
  const initializeGame = (level: number = difficulty) => {
    setDifficulty(level)
    setDifficultyChoice(level)
    startPreview(level)
  }

  // Start demo mode
  const startDemo = () => {
    setShowDemo(true)
    setDemoStep(0)
    const demoCards = generateColorCards(3).map((c) => ({ ...c, isFlipped: true, isMatched: false }))
    setCards(demoCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setGameStarted(false)
    setGameCompleted(false)
    setTotalTime(0)
    setDifficulty(3)
    setMode('pair')
    setPreviewing(false)

    // Show demo steps - slower timing for elderly users
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1) // Show how to flip cards
      demoTimeoutRef.current = setTimeout(() => {
        // Flip one card
        if (demoCards.length > 0) {
          setFlippedCards([demoCards[0].id])
        }
        demoTimeoutRef.current = setTimeout(() => {
          setDemoStep(2) // Show second card flip
          if (demoCards.length > 1) {
            setFlippedCards([demoCards[0].id, demoCards[1].id])
          }
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(3) // Show matching result
            setDemoStep(4) // End demo
          }, 4000)
        }, 3000)
      }, 4000)
    }, 3000)
  }

  // Close demo
  const closeDemo = () => {
    setShowDemo(false)
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current)
      demoTimeoutRef.current = null
    }
  }

  // Start the level immediately without preview
  const startNow = (level: number) => {
    const lvl = Math.max(1, Math.min(100, level))
    // clear any pending preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    setDifficulty(lvl)
    const newCards = generateColorCards(lvl).map((c) => ({ ...c, isFlipped: false, isMatched: false }))
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setPreviewing(false)
    setGameCompleted(false)
    setTotalTime(0)
    // determine mode for immediate start
    if (lvl >= 21) {
      setMode('selective')
      const colors = newCards.map((c) => c.color)
      const unique = Array.from(new Set(colors))
      const target = unique[Math.floor(Math.random() * unique.length)]
      setTargetColor(target)
      setTargetCount(newCards.filter((c) => c.color === target).length)
    } else if (lvl >= 11) {
      setMode('shape')
      setTargetColor(null)
      setTargetCount(0)
    } else {
      setMode('pair')
      setTargetColor(null)
      setTargetCount(0)
    }

    setGameStarted(true)
  }

  // Show all cards (flipped) for 3 seconds, then hide and start the game timer
  const startPreview = (level: number) => {
    const lvl = Math.max(1, Math.min(100, level))
    setDifficulty(lvl)
    // clear any existing preview timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }

    const newCards = generateColorCards(lvl).map((c) => ({ ...c, isFlipped: true, isMatched: false }))
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setGameStarted(false)
    setGameCompleted(false)
    setTotalTime(0)
    setPreviewing(true)

    // set mode during preview
    if (lvl >= 21) {
      setMode('selective')
      const colors = newCards.map((c) => c.color)
      const unique = Array.from(new Set(colors))
      const target = unique[Math.floor(Math.random() * unique.length)]
      setTargetColor(target)
      setTargetCount(newCards.filter((c) => c.color === target).length)
    } else if (lvl >= 11) {
      setMode('shape')
      setTargetColor(null)
      setTargetCount(0)
    } else {
      setMode('pair')
      setTargetColor(null)
      setTargetCount(0)
    }

    previewTimeoutRef.current = setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })))
      setPreviewing(false)
      setGameStarted(true)
      previewTimeoutRef.current = null
    }, 10000)
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // cleanup preview timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
        previewTimeoutRef.current = null
      }
    }
  }, [])

  // Ensure default difficulty is 1 on mount but do NOT auto-start level 1.
  useEffect(() => {
    setDifficulty(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle card flip
  const handleCardClick = (cardId: string) => {
    if (previewing) return
    if (gameCompleted) return
    const clicked = cards.find((c) => c.id === cardId)
    if (!clicked || clicked.isMatched) return

    if (mode === 'selective') {
      if (!targetColor) return
      // if correct color
      if (clicked.color === targetColor) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isMatched: true } : c)))
        setMatchedPairs((m) => m + 1)
        // check if done
        const remaining = cards.filter((c) => c.color === targetColor && !c.isMatched).length
        if (remaining <= 1) {
          setGameCompleted(true)
          setGameStarted(false)
        }
      } else {
        setMoves((m) => m + 1)
      }
      return
    }

    // Pair / shape mode
    if (flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    setMoves((m) => m + 1)

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped
      const firstCard = cards.find((c) => c.id === first)
      const secondCard = cards.find((c) => c.id === second)

      const isColorMatch = firstCard && secondCard && firstCard.color === secondCard.color
      const isShapeMatch = firstCard && secondCard && (firstCard.shape && secondCard.shape && firstCard.shape === secondCard.shape)

      const matched = mode === 'shape' ? isColorMatch && isShapeMatch : isColorMatch

      if (matched) {
        setCards((prev) => prev.map((c) => (c.id === first || c.id === second ? { ...c, isMatched: true } : c)))
        setMatchedPairs((m) => m + 1)
        setFlippedCards([])
      } else {
        setTimeout(() => setFlippedCards([]), 1000)
      }
    }
  }

  // Check if game is completed
  useEffect(() => {
    if (!gameStarted) return
    if (mode === 'selective') {
      const totalTargets = cards.filter((c) => c.color === targetColor).length
      if (totalTargets > 0 && matchedPairs >= totalTargets) {
        setGameCompleted(true)
      }
    } else {
      if (matchedPairs > 0 && matchedPairs === Math.floor(cards.length / 2)) {
        setGameCompleted(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedPairs, cards, gameStarted, mode, targetColor])

  const totalCards = cards.length || 8
  const maxPairs = totalCards / 2
  const displayMax = mode === 'selective' ? targetCount : maxPairs

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    const mm = String(m).padStart(1, '0')
    const ss = String(s).padStart(2, '0')
    return `${mm}:${ss}`
  }

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
            🎨 เกมจับคู่สี
          </h1>
          <button onClick={startDemo} className="absolute right-6 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 rounded-xl shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 font-black text-4xl border-2 border-yellow-200">
            💡
          </button>
        </div>
      </div>
      {/* Top stats bar - Three cards */}
      {gameStarted && !previewing && !gameCompleted && (
        <div className="sticky top-4 z-40 w-full max-w-4xl mb-8 mx-auto">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">เวลา</p>
              <p className="text-6xl font-black text-blue-600 tabular-nums">{formatTime(totalTime)}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">คู่ที่จับได้</p>
              <p className="text-6xl font-black text-cyan-600 tabular-nums">{matchedPairs}/{displayMax}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
              <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">การเคลื่อนไหว</p>
              <p className="text-6xl font-black text-green-600 tabular-nums">{moves}</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      {showDemo ? (
        <div className="w-full max-w-4xl">
          <div className="card text-center mb-8 border-6 border-success-500 bg-success-50 py-16 px-12">
            <h2 className="text-5xl font-black text-success-600 mb-6">📖 ตัวอย่างการเล่น</h2>
            <p className="text-3xl text-primary-600 mb-12">
              {demoStep === 0 && 'กำลังเตรียมตัวอย่าง...'}
              {demoStep === 1 && 'ขั้นตอนที่ 1: กดปุ่มเพื่อเปิดการ์ด'}
              {demoStep === 2 && 'ขั้นตอนที่ 2: กดปุ่มที่สองเพื่อหาคู่'}
              {demoStep === 3 && 'ขั้นตอนที่ 3: ถ้าสีตรงกัน ทั้งสองจะถูกจับคู่แล้ว!'}
              {demoStep === 4 && 'ตัวอย่างจบแล้ว! คุณพร้อมเล่นเกมจริงแล้วหรือ?'}
            </p>

            <div className="grid grid-cols-4 gap-6 mb-12 auto-rows-max justify-center px-4">
              {cards.slice(0, 4).map((card) => (
                <button
                  key={card.id}
                  disabled={true}
                  className={`w-32 h-32 rounded-3xl text-5xl font-bold transition-all duration-300 ${
                    flippedCards.includes(card.id)
                      ? 'bg-white text-center flex items-center justify-center'
                      : 'bg-gradient-to-br from-primary-400 to-primary-600'
                  }`}
                >
                  {flippedCards.includes(card.id) ? (
                    <div
                      className="w-full h-full flex items-center justify-center rounded-3xl"
                      style={{ backgroundColor: card.color }}
                    />
                  ) : (
                    '?'
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-6">
              <button onClick={closeDemo} className="btn-secondary flex-1 py-6 text-2xl font-black">
                ปิด
              </button>
              {demoStep === 4 && (
                <button onClick={() => { closeDemo(); startPreview(difficulty) }} className="btn-primary flex-1 py-6 text-2xl font-black">
                  เริ่มเล่นเลย!
                </button>
              )}
            </div>
          </div>
        </div>
      ) : !gameStarted && !previewing ? (
        <div className="w-full max-w-6xl">
          <div className="card text-center mb-8 py-24 px-16">
            <h2 className="text-6xl font-black text-primary-700 mb-12">ยินดีต้อนรับ!</h2>
            <p className="text-4xl text-primary-600 mb-12">
              จับคู่สีให้ตรงกัน
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
        <div className="w-full max-w-2xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
            <p className="text-3xl text-primary-600 mb-8">
              คุณจับคู่ได้สำเร็จ!
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-primary-50 p-6 rounded-xl">
                <p className="text-lg text-primary-500 mb-2">คู่ที่จับได้</p>
                <p className="text-5xl font-bold text-primary-700">{matchedPairs}/{maxPairs}</p>
              </div>
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-warning-700">{formatTime(totalTime)}</p>
              </div>
            </div>

            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {difficulty === 1 && (
                <button
                  onClick={() => initializeGame(2)}
                  className="btn-primary w-full"
                >
                  ยาก
                </button>
              )}

              <Link href="/welcome" className="btn-primary w-full text-center">กลับหน้าแรก</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className={`w-full ${difficulty === 1 ? 'max-w-4xl' : 'max-w-6xl'}`}>
          <div className={`grid ${difficulty === 1 ? 'grid-cols-5' : 'grid-cols-7'} gap-3 mb-8 auto-rows-max`}>
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched}
                className={`aspect-square rounded-2xl text-5xl font-bold transition-all duration-300 transform ${
                  flippedCards.includes(card.id) || card.isMatched
                    ? 'bg-white text-center flex items-center justify-center'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700'
                } ${card.isMatched ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {card.isFlipped || flippedCards.includes(card.id) || card.isMatched ? (
                  card.shape ? (
                    <div className="w-full h-full flex items-center justify-center rounded-2xl bg-white">
                      {card.shape === 'circle' && (
                        <div style={{ backgroundColor: card.color }} className="w-3/5 h-3/5 rounded-full" />
                      )}
                      {card.shape === 'square' && (
                        <div style={{ backgroundColor: card.color }} className="w-3/5 h-3/5 rounded-md" />
                      )}
                      {card.shape === 'triangle' && (
                        <div style={{ width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent', borderBottom: `52px solid ${card.color}` }} />
                      )}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center rounded-2xl"
                      style={{ backgroundColor: card.color }}
                    />
                  )
                ) : (
                  '?'
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-lg text-primary-600 mt-8">
      </footer>
    </div>
  )
}
