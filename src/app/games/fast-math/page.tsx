'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
// ตรวจสอบ path ของ utils ให้ถูกต้อง
import { generateMathQuestion, calculateScore, getTimeLimit, saveGameHistory } from '@/utils/gameUtils'

interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+'
  correctAnswer: number
  options: number[]
}

export default function FastMathGame() {
  // --- 1. เพิ่มตัวแปรเช็ค Mode ---
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily'; // เช็คว่าเป็นโหมดรายวันไหม
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);

  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  const [score, setScore] = useState(0)
  
  // ใช้ค่าจาก URL เป็นค่าเริ่มต้น
  const [difficulty, setDifficulty] = useState(levelFromQuery)
  
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<Array<{question: MathQuestion, selected: number | null}>>([])

  // Initialize game
  const initializeGame = () => {
    // ใช้ levelFromQuery หรือ difficulty ปัจจุบันในการเริ่มเกม
    const newQuestion = generateMathQuestion(levelFromQuery)
    setCurrentQuestion(newQuestion)
    setScore(0)
    setGameStarted(true)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTimeElapsed(0)
    setWrongAnswers([])
  }

  // --- 2. Auto Start สำหรับ Daily Mode ---
  useEffect(() => {
    // ถ้าเป็น Daily Mode และเกมยังไม่เริ่ม ให้เริ่มเลย
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame();
    }
  }, [isDailyMode]); 

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
    setQuestionsAnswered(prev => prev + 1)

    if (answer === currentQuestion?.correctAnswer) {
      setCorrectAnswers(prev => prev + 1)
      setScore(prev => prev + 1)
    } else {
      if (currentQuestion) {
        setWrongAnswers(prev => [...prev, { question: currentQuestion, selected: answer }])
      }
    }

    setTimeout(() => {
      if (questionsAnswered + 1 < 10) {
        loadNextQuestion()
      } else {
        // Calculate final score (including last answer)
        let finalScore = score;
        if (answer === currentQuestion?.correctAnswer) {
          finalScore += 1;
        }
        setGameCompleted(true);
        // Save only if logged in
        const username = localStorage.getItem('profile_username');
        if (username) {
          // Save play history (user-specific)
          saveGameHistory(`fast-math_${username}`, finalScore);
          // Save summary statistics (user-specific)
          try {
            const key = `stat_fast-math_${username}`;
            const raw = localStorage.getItem(key);
            let prev = { gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-' };
            if (raw) prev = JSON.parse(raw);
            const newGamesPlayed = prev.gamesPlayed + 1;
            const newAverageScore = Math.round((prev.averageScore * prev.gamesPlayed + finalScore) / newGamesPlayed);
            const newHighScore = Math.max(prev.highScore, finalScore);
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
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'

  // helper แปลงวินาทีเป็น mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Helper แปลงค่าความยากเป็นข้อความ
  const difficultyLabel = (level: number) => {
    if (level <= 1) return 'ง่าย';
    if (level >= 5) return 'ยาก';
    return 'กลาง';
  };
  // ระดับถัดไป
  const nextDifficulty = (level: number) => {
    if (level <= 1) return 3;
    if (level === 3) return 5;
    return 5;
  };
  const nextDifficultyLabel = (level: number) => {
    if (level <= 1) return 'กลาง';
    if (level === 3) return 'ยาก';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
          {/* ซ่อนปุ่มกลับหน้าหลักถ้าเป็น Daily Mode */}
          {!isDailyMode && (
            <Link
                href="/welcome"
                className="text-xl font-bold mb-4 inline-block px-6 py-2 border-4 border-primary-400 bg-white rounded-full shadow-lg text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-800 transition-all duration-150"
                style={{ boxShadow: '0 4px 16px 0 rgba(59,130,246,0.10)' }}
            >
                ← กลับหน้าหลัก
            </Link>
          )}
        <h1 className="game-title">🔢 เกมบวกเลข</h1>
      </div>

      {/* Game Stats */}
      {(!gameCompleted) && (
        <div className="w-full max-w-2xl card mb-8 bg-white">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <p className="text-lg text-primary-500 mb-2">คะแนน</p>
              <span className="score-display text-4xl md:text-5xl">{score}</span>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <p className="text-lg text-primary-500 mb-2">เวลา</p>
              <span className="score-display text-4xl md:text-5xl">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <p className="text-lg text-primary-500 mb-2">คำถาม</p>
              <span className="score-display text-4xl md:text-5xl leading-tight">{questionsAnswered}/10</span>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[120px]">
              <p className="text-lg text-primary-500 mb-2">ระดับ</p>
              <span className="score-display text-4xl md:text-5xl">{difficultyLabel(difficulty)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      {!gameStarted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">เริ่มเล่นตามระดับที่สุ่มมา</p>

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
                <p className="text-lg text-success-600 mb-2">จำนวนคำถาม</p>
                <p className="text-5xl font-bold text-success-700">{questionsAnswered}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-lg text-blue-600 mb-2">ระดับ</p>
                <p className="text-5xl font-bold text-blue-700">{difficultyLabel(difficulty)}</p>
              </div>
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2">ใช้เวลา</p>
                <p className="text-5xl font-bold text-warning-700">{formatTime(timeElapsed)}</p>
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
                    {(difficulty === 1 || difficulty === 3) && (
                        <button
                        onClick={() => {
                            setDifficulty(nextDifficulty(difficulty));
                            setTimeout(() => initializeGame(), 100);
                        }}
                        className="btn-success flex-1"
                        >
                        ถัดไป ({nextDifficultyLabel(difficulty)})
                        </button>
                    )}
                </div>
            )}

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