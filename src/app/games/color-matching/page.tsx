'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get('level');
  const isDailyMode = searchParams.get('mode') === 'daily';
  const dailyStep = searchParams.get('dailyStep'); // รับค่า step ที่เล่นอยู่

  const [cards, setCards] = useState<ColorCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewTimer, setPreviewTimer] = useState(0) 
  const [totalTime, setTotalTime] = useState(0)
  const [moves, setMoves] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startGame = (level: number) => {
    const lvl = Math.max(1, Math.min(100, level))
    setDifficulty(lvl)
    const newCards = generateColorCards(lvl).map((c) => ({ ...c, isFlipped: true, isMatched: false }))
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setTotalTime(0)
    setGameCompleted(false)
    setGameStarted(true)
    setPreviewing(true)
    setPreviewTimer(10) 
  }

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted && levelParam) {
      startGame(parseInt(levelParam, 10) || 1);
    }
  }, [isDailyMode, levelParam]);

  useEffect(() => {
    if (!previewing || previewTimer <= 0) {
      if (previewing && previewTimer <= 0) {
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })))
        setPreviewing(false)
      }
      return
    }
    const timer = setInterval(() => { setPreviewTimer((prev) => prev - 1) }, 1000)
    return () => clearInterval(timer)
  }, [previewing, previewTimer])

  useEffect(() => {
    if (!gameStarted || gameCompleted || previewing) return
    const timer = setInterval(() => { setTotalTime((prev) => prev + 1) }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted, previewing])

  const handleCardClick = (cardId: string) => {
    if (previewing || gameCompleted) return 
    const clicked = cards.find((c) => c.id === cardId)
    // เพิ่มเงื่อนไข: ถ้าการ์ดจับคู่ไปแล้ว ห้ามกดซ้ำ
    if (!clicked || clicked.isMatched || flippedCards.includes(cardId)) return
    
    // ห้ามเปิดเกิน 2 ใบ
    if (flippedCards.length >= 2) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    setMoves((m) => m + 1)

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped
      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = cards.find((c) => c.id === secondId)

      if (firstCard && secondCard && firstCard.color === secondCard.color) {
        // Match Found!
        setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true, isFlipped: true } : c)))
        setMatchedPairs((m) => m + 1)
        setFlippedCards([]) 
      } else {
        // No Match
        setTimeout(() => { setFlippedCards([]) }, 1000)
      }
    }
  }

  // Check Completion
  useEffect(() => {
    if (!gameStarted) return
    const totalPairs = Math.floor(cards.length / 2)
    if (matchedPairs > 0 && matchedPairs === totalPairs) {
      // รอ animation จบสักนิดก่อนขึ้นหน้าชนะ
      setTimeout(() => setGameCompleted(true), 800)
    }
  }, [matchedPairs, cards, gameStarted])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const startDemo = () => {
    setShowDemo(true); setDemoStep(0);
    const demoCards = generateColorCards(3).map((c) => ({ ...c, isFlipped: true, isMatched: false }))
    setCards(demoCards); setFlippedCards([]); setGameStarted(false); setPreviewing(false);
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1)
      demoTimeoutRef.current = setTimeout(() => {
        if (demoCards.length > 0) setFlippedCards([demoCards[0].id])
        demoTimeoutRef.current = setTimeout(() => {
          setDemoStep(2)
          if (demoCards.length > 1) setFlippedCards([demoCards[0].id, demoCards[1].id])
          demoTimeoutRef.current = setTimeout(() => { setDemoStep(3); setDemoStep(4) }, 4000)
        }, 3000)
      }, 4000)
    }, 2000)
  }
  const closeDemo = () => { setShowDemo(false); if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current); }

  if (isDailyMode && !gameStarted && !gameCompleted) return <div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังเตรียมเกม...</div>;

  if (!gameStarted && !showDemo && !isDailyMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#fff1f2] font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-block animate-bounce-gentle mb-4">
              <span className="text-8xl md:text-9xl drop-shadow-lg filter">🎨</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#1e3a8a] mb-4 tracking-tight drop-shadow-sm">เกมจับคู่สี</h1>
            <p className="text-2xl md:text-3xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              ฝึกความจำและการสังเกต <br className="hidden md:block" /> จำตำแหน่งสี แล้วจับคู่ให้ถูกต้อง
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full px-4 md:px-0">
            <button onClick={() => startGame(1)} className="group relative bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)] border-4 border-white hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2 text-center flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 bg-blue-50 rounded-full flex items-center justify-center text-7xl md:text-8xl mb-6 shadow-inner group-hover:scale-110 transition-transform">😊</div>
              <h3 className="text-4xl font-bold text-blue-700 mb-2">ระดับธรรมดา</h3>
              <p className="text-xl text-slate-500 font-medium">จำนวนไพ่น้อย เริ่มต้นฝึกฝน</p>
            </button>
            <button onClick={() => startGame(2)} className="group relative bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgba(168,85,247,0.2)] border-4 border-white hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-2 text-center flex flex-col items-center">
              <div className="w-28 h-28 md:w-36 md:h-36 bg-purple-50 rounded-full flex items-center justify-center text-7xl md:text-8xl mb-6 shadow-inner group-hover:scale-110 transition-transform">🤓</div>
              <h3 className="text-4xl font-bold text-purple-700 mb-2">ระดับยาก</h3>
              <p className="text-xl text-slate-500 font-medium">ท้าทายความจำ จำนวนไพ่เยอะขึ้น</p>
            </button>
          </div>
          <div className="mt-16 flex flex-col md:flex-row items-center gap-6">
            <Link href="/welcome" className="px-10 py-4 rounded-2xl text-slate-500 font-bold text-xl hover:bg-white/60 hover:text-slate-700 transition-all flex items-center gap-2"><span>⬅</span> กลับหน้าหลัก</Link>
            <button onClick={startDemo} className="px-10 py-4 rounded-2xl bg-yellow-100/80 backdrop-blur text-yellow-800 font-bold text-xl hover:bg-yellow-200 hover:scale-105 transition-all shadow-md flex items-center gap-3 border-2 border-yellow-200"><span>💡</span> ดูตัวอย่างการเล่น</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full bg-gradient-to-r from-pink-100 via-blue-50 to-cyan-100 py-4 sticky top-0 z-50 mb-6 rounded-b-2xl shadow-lg drop-shadow-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {!isDailyMode ? (
            <button onClick={() => { setGameStarted(false); setPreviewing(false); }} className="flex items-center gap-2 px-8 py-3 text-lg md:text-xl font-bold text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-400 hover:from-pink-400 hover:to-cyan-400 hover:scale-105 rounded-full shadow-xl border-2 border-pink-200 hover:border-blue-300 focus:outline-none focus:ring-4 focus:ring-pink-200/60 transition-all duration-200 drop-shadow-lg" style={{ minWidth: '150px', boxShadow: '0 4px 24px 0 rgba(236,72,153,0.18), 0 1.5px 8px 0 rgba(59,130,246,0.10)' }}>
              <span className="text-2xl">✕</span> <span>เลิกเล่น</span>
            </button>
          ) : (
            <div className="px-5 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-bold">📅 ภารกิจประจำวัน</div>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tight drop-shadow-sm text-center flex-1">
            {difficulty === 1 ? 'ระดับธรรมดา' : 'ระดับยาก'}
          </h1>
          <div className="w-[150px]" />
        </div>
      </div>
      {!gameCompleted && !showDemo && (
        <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mb-8">
          <div className="bg-white p-4 rounded-2xl text-center"><p className="text-slate-400 font-bold">เวลา</p><p className="text-4xl font-black text-blue-600">{formatTime(totalTime)}</p></div>
          <div className="bg-white p-4 rounded-2xl text-center"><p className="text-slate-400 font-bold">คู่ที่ได้</p><p className="text-4xl font-black text-cyan-600">{matchedPairs}/{cards.length/2}</p></div>
          <div className="bg-white p-4 rounded-2xl text-center"><p className="text-slate-400 font-bold">ครั้ง</p><p className="text-4xl font-black text-green-600">{moves}</p></div>
        </div>
      )}
      {showDemo && (<div className="w-full max-w-4xl card text-center bg-yellow-50 p-8 rounded-[2.5rem]"><h2 className="text-4xl font-bold text-yellow-800 mb-6">📖 ตัวอย่าง</h2><div className="flex justify-center gap-6 mb-10">{cards.slice(0,4).map(c=><div key={c.id} className="w-28 h-28 bg-white flex items-center justify-center text-5xl rounded-2xl">{flippedCards.includes(c.id)?<div className="w-full h-full rounded-2xl" style={{backgroundColor:c.color}}></div>:'?'}</div>)}</div><button onClick={closeDemo} className="px-12 py-4 bg-white font-bold rounded-2xl">ปิดตัวอย่าง</button></div>)}
      {!showDemo && !gameCompleted && (
        <div className="relative w-full max-w-4xl flex flex-col items-center">
          {previewing && <div className="mb-8 animate-bounce z-20 sticky top-24"><span className="bg-yellow-400 px-8 py-4 rounded-full text-3xl font-black">⏳ จำตำแหน่ง! {previewTimer}</span></div>}
          <div className={`grid gap-3 w-full justify-center ${difficulty===1?'grid-cols-4 md:grid-cols-5':'grid-cols-5 md:grid-cols-7'}`}>
            {cards.map((card) => {
              const isShown = card.isFlipped || card.isMatched || flippedCards.includes(card.id) || previewing;
              
              // --- 1. ปรับ Style เมื่อถูกจับคู่ (Effect หายตัว) ---
              // opacity-0: หายไป
              // scale-125 rotate-12: ขยายและหมุนนิดนึง (น่ารักๆ) ก่อนหาย
              // duration-700: ค่อยๆ หายอย่างนุ่มนวล

              // เพิ่มสไตล์เมื่อถูกเลือก (flipped)
              const isFlippedNow = flippedCards.includes(card.id);
              const matchedStyle = card.isMatched 
                ? 'opacity-0 scale-125 rotate-12 pointer-events-none' 
                : isFlippedNow
                  ? 'ring-4 ring-yellow-400 ring-offset-2 scale-105 z-10' // สีขอบเหลืองและขยายเล็กน้อยเมื่อเลือก
                  : 'opacity-100 scale-100 hover:scale-105 active:scale-95';

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isMatched || previewing}
                  className={`
                    aspect-square w-full rounded-2xl shadow-md 
                    transition-all duration-700 ease-out transform
                    ${matchedStyle}
                    ${isShown && !card.isMatched ? 'rotate-y-180 bg-white' : ''} 
                    ${!isShown && !card.isMatched ? 'bg-gradient-to-br from-blue-400 to-blue-600' : ''}
                  `}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className={`w-full h-full rounded-2xl flex items-center justify-center text-4xl ${isFlippedNow && !card.isMatched ? 'ring-4 ring-yellow-300 bg-yellow-100/80' : ''}`}
                    style={{backgroundColor: (isShown && !card.isMatched) ? card.color : undefined }}
                  >
                    {/* --- 2. Gimmick: ถ้าถูกจับคู่ (isMatched) ให้โชว์วิ้งค์ๆ ✨ ก่อนหายไป --- */}
                    {card.isMatched && (
                        <span className="text-6xl animate-spin">✨</span>
                    )}

                    {!(isShown || card.isMatched) && <span className="text-white/50">?</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {gameCompleted && (
        <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
           <h2 className="text-6xl font-black text-blue-900 mb-4">เก่งมาก!</h2>
           <div className="grid grid-cols-2 gap-6 mb-10"><div className="bg-blue-50 p-6 rounded-3xl"><p className="text-blue-600 font-bold">เวลา</p><p className="text-5xl font-black">{formatTime(totalTime)}</p></div><div className="bg-green-50 p-6 rounded-3xl"><p className="text-green-600 font-bold">จำนวนครั้ง</p><p className="text-5xl font-black">{moves}</p></div></div>
           {isDailyMode ? (
              <button onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} className="w-full py-5 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-2xl shadow-lg">✅ ผ่านด่าน (ไปต่อ)</button>
           ) : (
             <div className="flex gap-4"><button onClick={()=>startGame(difficulty)} className="flex-1 py-5 bg-blue-600 text-white font-bold rounded-2xl">เล่นอีกครั้ง</button><button onClick={()=>setGameStarted(false)} className="flex-1 py-5 bg-white border-2 text-slate-600 font-bold rounded-2xl">กลับเมนู</button></div>
           )}
        </div>
      )}
    </div>
  )
}