'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateColorCards, calculateScore, getTimeLimit } from '@/utils/gameUtils'

interface ColorCard {
  id: string
  color: string
  displayName: string
  isFlipped: boolean
  isMatched: boolean
}

export default function ColorMatchingGame() {
  const [cards, setCards] = useState<ColorCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(180)
  const [totalTime, setTotalTime] = useState(0)
  const [moves, setMoves] = useState(0)

  // Initialize game
  const initializeGame = () => {
    const newCards = generateColorCards(difficulty)
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setScore(0)
    setMoves(0)
    setGameStarted(true)
    setGameCompleted(false)
    setTimeRemaining(getTimeLimit('color-matching', difficulty))
    setTotalTime(0)
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameCompleted(true)
          return 0
        }
        return prev - 1
      })
      setTotalTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // Handle card flip
  const handleCardClick = (cardId: string) => {
    if (gameCompleted || flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    setMoves(moves + 1)

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped
      const firstCard = cards.find((c) => c.id === first)
      const secondCard = cards.find((c) => c.id === second)

      if (firstCard && secondCard && firstCard.color === secondCard.color) {
        // Match found
        setCards(
          cards.map((c) =>
            c.id === first || c.id === second ? { ...c, isMatched: true } : c,
          ),
        )
        setScore(score + 10 + difficulty * 2)
        setMatchedPairs(matchedPairs + 1)
        setFlippedCards([])
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  // Check if game is completed
  useEffect(() => {
    if (gameStarted && matchedPairs > 0 && matchedPairs === cards.length / 2) {
      setGameCompleted(true)
    }
  }, [matchedPairs, cards, gameStarted])

  const totalCards = cards.length || 8
  const maxPairs = totalCards / 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← กลับหน้าแรก
        </Link>
        <h1 className="game-title">🎨 เกมจับคู่สี</h1>
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
            <p className="text-lg text-primary-500 mb-2">คู่ที่จับได้</p>
            <p className="score-display">
              {matchedPairs}/{maxPairs}
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
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
            <p className="text-3xl text-primary-600 mb-8">
              คุณจับคู่ได้สำเร็จ!
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
        <div className="w-full max-w-2xl">
          <div className="grid grid-cols-4 gap-3 mb-8 auto-rows-max">
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
                {flippedCards.includes(card.id) || card.isMatched ? (
                  <div
                    className="w-full h-full flex items-center justify-center rounded-2xl"
                    style={{ backgroundColor: card.color }}
                  />
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
        <p>เล่นเกมสม่ำเสมอเพื่อกระตุ้นสมองของคุณ</p>
      </footer>
    </div>
  )
}
