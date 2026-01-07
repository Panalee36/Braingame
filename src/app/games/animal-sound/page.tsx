"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
// ตรวจสอบ path ของ utils ให้ถูกต้องตามโปรเจกต์ของคุณ
import { generateAnimalSounds, calculateScore, getTimeLimit, saveGameHistory } from '@/utils/gameUtils'

interface AnimalSound {
  id: string
  name: string
  soundUrl: string
  imageUrl: string
}

export default function AnimalSoundGame() {
  // --- 1. รับค่าจาก URL (Daily Mode Logic) ---
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily'; // เช็คโหมดรายวัน
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);

  const [currentAnimal, setCurrentAnimal] = useState<AnimalSound | null>(null)
  const [options, setOptions] = useState<AnimalSound[]>([])
  const [score, setScore] = useState(0)
  
  // ใช้ค่าจาก URL เป็นค่าเริ่มต้น
  const [difficulty, setDifficulty] = useState(levelFromQuery);
  
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)

  // Initialize game
  const initializeGame = () => {
    const { currentAnimal: animal, options: opts } = generateAnimalSounds()
    setCurrentAnimal(animal)
    setOptions(opts)
    setScore(0)
    setGameStarted(true)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setSoundPlayed(false)
    setTimeElapsed(0)
    setTotalTime(0)
  }

  // --- 2. Auto Start สำหรับ Daily Mode ---
  useEffect(() => {
    // ถ้าเป็น Daily Mode และเกมยังไม่เริ่ม ให้เริ่มเลย
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame();
    }
  }, [isDailyMode]); // ทำงานเมื่อค่า isDailyMode เปลี่ยน หรือโหลดหน้า

  // Load next question
  const loadNextQuestion = () => {
    const { currentAnimal: animal, options: opts } = generateAnimalSounds()
    setCurrentAnimal(animal)
    setOptions(opts)
    setSelectedAnswer(null)
    setAnswered(false)
    setSoundPlayed(false) // รีเซ็ตสถานะการเล่นเสียงเมื่อขึ้นข้อใหม่
  }

  // Handle answer
  const handleAnswer = (animalId: string) => {
    if (answered) return

    setSelectedAnswer(animalId)
    setAnswered(true)
    setQuestionsAnswered(questionsAnswered + 1)

    if (animalId === currentAnimal?.id) {
      setCorrectAnswers(correctAnswers + 1)
      setScore(score + 10 + difficulty * 2)
    }

    setTimeout(() => {
        const limit = getTimeLimit('animal-sound', difficulty)
        if (questionsAnswered + 1 < limit) {
        loadNextQuestion()
      } else {
        setGameCompleted(true);
        // Save only if logged in
        const username = localStorage.getItem('profile_username');
        if (username) {
          saveGameHistory(`animal-sound_${username}`, score);
          try {
            const key = `stat_animal-sound_${username}`;
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
    }, 1500)
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
        setTimeElapsed((prev: number) => prev + 1)
        setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // Play sound effect
  const playSound = () => {
    setSoundPlayed(true)
    // In a real app, you would play actual sound files here
    // ตัวอย่าง: new Audio(currentAnimal.soundUrl).play();
  }

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'

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
        <h1 className="game-title">🐕 เกมฟังเสียงสัตว์</h1>
      </div>

      {/* Game Stats */}
      <div className="w-full max-w-2xl card mb-8 bg-white">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <p className="text-lg text-primary-500 mb-2">คะแนน</p>
            <span className="score-display text-4xl md:text-5xl">{score}</span>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <p className="text-lg text-primary-500 mb-2">เวลา</p>
              <span className="score-display text-4xl md:text-5xl">{timeElapsed}s</span>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <p className="text-lg text-primary-500 mb-2">จำได้</p>
            <span className="score-display text-4xl md:text-5xl leading-tight">{correctAnswers}/{questionsAnswered}</span>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <p className="text-lg text-primary-500 mb-2">ระดับ</p>
            <span className="score-display text-4xl md:text-5xl">{difficulty}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      {!gameStarted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">
              ฟังเสียงสัตว์ แล้วเลือกรูปที่ตรงกัน
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
                <p className="text-lg text-success-600 mb-2">จำนวนสัตว์</p>
                <p className="text-5xl font-bold text-success-700">{questionsAnswered}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-lg text-blue-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-blue-700">{totalTime}s</p>
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
      ) : currentAnimal && options.length > 0 ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <p className="text-2xl text-primary-600 mb-6">ฟังเสียง และเลือกสัตว์</p>

            <button
              onClick={playSound}
              className={`btn-primary w-full text-3xl mb-8 ${soundPlayed ? 'scale-95' : ''}`}
            >
              🔊 {soundPlayed ? 'เล่นเสียงอีกครั้ง' : 'เล่นเสียง'}
            </button>

            <p className="text-xl text-primary-600 mb-6">
              {soundPlayed ? 'เลือกรูปสัตว์ที่ตรงกับเสียง' : 'กดปุ่มเพื่อเล่นเสียง'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={answered || !soundPlayed}
                className={`py-8 px-4 text-6xl rounded-2xl transition-all ${
                  selectedAnswer === option.id
                    ? option.id === currentAnimal.id
                      ? 'btn-success scale-110'
                      : 'btn-error scale-110'
                    : 'btn-secondary hover:scale-105'
                } ${answered || !soundPlayed ? 'opacity-70' : ''}`}
              >
                {option.imageUrl}
              </button>
            ))}
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