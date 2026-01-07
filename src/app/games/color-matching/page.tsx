"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
// ตรวจสอบ path ของ utils ให้ถูกต้อง
import { generateColorCards, calculateScore, getTimeLimit } from '@/utils/gameUtils'

interface ColorCard {
  id: string
  color: string
  displayName: string
  isFlipped: boolean
  isMatched: boolean
}

export default function ColorMatchingGame() {
  // --- 1. เพิ่มตัวแปรเช็ค Mode ---
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily'; // เช็คว่าเป็นโหมดรายวันไหม
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);

  const [cards, setCards] = useState<ColorCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [score, setScore] = useState(0)
  
  // ใช้ค่าจาก URL เป็นค่าเริ่มต้น
  const [difficulty, setDifficulty] = useState(levelFromQuery);
  
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
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
    setTimeElapsed(0)
  }

  // --- 2. Auto Start สำหรับ Daily Mode ---
  useEffect(() => {
    // ถ้าเป็น Daily Mode และเกมยังไม่เริ่ม ให้เริ่มเลย
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame();
    }
  }, [isDailyMode]); // ทำงานเมื่อโหลดหน้ามาแล้วเจอ mode=daily

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
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
      const firstCard = cards.find((c: ColorCard) => c.id === first)
      const secondCard = cards.find((c: ColorCard) => c.id === second)

      if (firstCard && secondCard && firstCard.color === secondCard.color) {
        // Match found
        setCards(
          cards.map((c: ColorCard) =>
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
      // Save only if logged in
      const username = localStorage.getItem('profile_username');
      if (username) {
        // Save play history (user-specific)
        try {
          // Save score to history
          const today = new Date().toISOString().slice(0, 10);
          const key = `stat_color-matching_history_${username}`;
          let history = [];
          const raw = localStorage.getItem(key);
          if (raw) history = JSON.parse(raw);
          history.push({ score, date: today });
          localStorage.setItem(key, JSON.stringify(history));
        } catch {}
        // Save summary statistics (user-specific)
        try {
          const key = `stat_color-matching_${username}`;
          const raw = localStorage.getItem(key);
          let prev = { gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-' };
          if (raw) prev = JSON.parse(raw);
          const newGamesPlayed = prev.gamesPlayed + 1;
          const newAverageScore = Math.round((prev.averageScore * prev.gamesPlayed + score) / newGamesPlayed);
          const newHighScore = Math.max(prev.highScore, score);
          const newLastPlayed = new Date().toISOString().slice(0, 10);
          localStorage.setItem(key, JSON.stringify({ gamesPlayed: newGamesPlayed, averageScore: newAverageScore, highScore: newHighScore, lastPlayed: newLastPlayed }));
        } catch {}
      }
    }
  }, [matchedPairs, cards, gameStarted, score])

  const totalCards = cards.length || 8
  const maxPairs = totalCards / 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
          {/* ซ่อนปุ่มกลับหน้าหลักถ้าเป็น Daily Mode */}
          {!isDailyMode && (
             <Link href="/welcome" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
             ← กลับหน้าแรก
             </Link>
          )}
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
            <p className="score-display">{timeElapsed}s</p>
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
        // --- 3. ส่วนแสดงผลตอนจบเกม (ปรับปรุงใหม่) ---
        <div className="w-full max-w-2xl animate-fade-in">
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
                <p className="text-5xl font-bold text-warning-700">{timeElapsed}s</p>
              </div>
            </div>

            {/* ปุ่มควบคุมตอนจบเกม */}
            {isDailyMode ? (
                // === ปุ่มสำหรับ Daily Mode ===
                <button 
                  onClick={() => window.close()} 
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  ❌ ปิดหน้าต่าง (รับรางวัล)
                </button>
            ) : (
                // === ปุ่มสำหรับเล่นปกติ ===
                <div className="flex gap-4 flex-col md:flex-row">
                  <button onClick={() => initializeGame()} className="btn-primary flex-1">
                    เล่นอีกครั้ง
                  </button>
                  <Link href="/" className="btn-secondary flex-1 text-center flex items-center justify-center">
                    กลับหน้าแรก
                  </Link>
                </div>
            )}
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