'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+' | '-'
  correctAnswer: number
  options: number[]
  nums?: number[]
}

export default function FastMathGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');

  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(levelFromQuery)
  
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  const timeRef = useRef<number>(timeRemaining)
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameCompletedRef = useRef<boolean>(gameCompleted)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const customGenerateMathQuestion = (level: number): MathQuestion => {
    if (level === 1) {
      const min = 10, max = 99;
      let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
      let num2 = Math.floor(Math.random() * (max - min + 1)) + min;
      let operation = Math.random() < 0.5 ? '+' : '-';
      if (operation === '-' && num1 < num2) [num1, num2] = [num2, num1];
      if (operation === '-' && num1 === num2) operation = '+';
      let correctAnswer = operation === '+' ? num1 + num2 : num1 - num2;
      const options = [correctAnswer];
      while (options.length < 4) {
        let delta = Math.floor(Math.random() * 10) + 1;
        if (Math.random() < 0.5) delta = -delta;
        let opt = correctAnswer + delta;
        if (!options.includes(opt) && opt >= 0) options.push(opt);
      }
      return { id: Math.random().toString(36).slice(2), num1, num2, operation: operation as '+' | '-', correctAnswer, options: options.sort(() => Math.random() - 0.5) };
    } else {
      const numCount = Math.random() < 0.5 ? 3 : 4;
      const nums: number[] = [];
      for (let i = 0; i < numCount; i++) nums.push(Math.floor(Math.random() * 10));
      const correctAnswer = nums.reduce((a, b) => a + b, 0);
      const options = [correctAnswer];
      while (options.length < 4) {
        let delta = Math.floor(Math.random() * 4) + 1;
        if (Math.random() < 0.5) delta = -delta;
        let opt = correctAnswer + delta;
        if (!options.includes(opt) && opt >= 0) options.push(opt);
      }
      return { id: Math.random().toString(36).slice(2), num1: nums[0], num2: nums[1], operation: '+', correctAnswer, options: options.sort(() => Math.random() - 0.5), nums } as MathQuestion;
    }
  };

  const initializeGame = (levelOverride?: number) => {
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
    const levelToUse = levelOverride || difficulty;
    setDifficulty(levelToUse);
    const newQuestion = customGenerateMathQuestion(levelToUse);
    setCurrentQuestion(newQuestion);
    setScore(0);
    setGameStarted(true);
    setGameCompleted(false);
    gameCompletedRef.current = false;
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setTimeRemaining(120); 
    setTotalTime(0);
  }

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame(levelFromQuery);
    }
  }, [isDailyMode]);

  const startDemo = () => {
    setShowDemo(true)
    setDemoStep(0)
    const demoQuestion = customGenerateMathQuestion(1) 
    setCurrentQuestion(demoQuestion)
    setGameStarted(false)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setTimeRemaining(120)
    setTotalTime(0)
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1) 
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2) 
        demoTimeoutRef.current = setTimeout(() => {
          setSelectedAnswer(demoQuestion.correctAnswer)
          setDemoStep(3) 
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4) 
          }, 3000)
        }, 3000)
      }, 2000)
    }, 2000)
  }

  const closeDemo = () => {
    setShowDemo(false)
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
  }

  const loadNextQuestion = () => {
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
    const newQuestion = customGenerateMathQuestion(difficulty);
    setCurrentQuestion(newQuestion);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const MAX_QUESTIONS = 10;

  const handleAnswer = (answer: number) => {
    if (answered) return
    setSelectedAnswer(answer)
    setAnswered(true)
    setQuestionsAnswered((q) => q + 1)
    if (answer === currentQuestion?.correctAnswer) {
      setCorrectAnswers((c) => c + 1)
      setScore((s) => s + 10) 
    }
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
    answerTimeoutRef.current = setTimeout(() => {
      answerTimeoutRef.current = null
      if (gameCompletedRef.current) return
      if (questionsAnswered + 1 >= MAX_QUESTIONS) {
        gameCompletedRef.current = true
        setGameCompleted(true)
      } else {
        loadNextQuestion()
      }
    }, 1500)
  }

  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  useEffect(() => { timeRef.current = timeRemaining }, [timeRemaining])
  useEffect(() => { gameCompletedRef.current = gameCompleted }, [gameCompleted])
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
    }
  }, [])

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const nextDifficulty = (level: number) => (level === 1 ? 2 : 1);
  const nextDifficultyLabel = (level: number) => (level === 1 ? 'ยาก' : 'ง่าย');

  if (isDailyMode && !gameStarted && !gameCompleted) {
     return <div className="p-10 text-center text-blue-600 font-bold animate-pulse">กำลังโหลดโจทย์...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8">
        {!isDailyMode && (
          gameStarted ? (
            <button onClick={() => { setGameStarted(false); setGameCompleted(false); setScore(0); setCurrentQuestion(null); }} className="text-xl font-bold mb-4 inline-block px-6 py-2 border-4 border-primary-400 bg-white rounded-full shadow-lg text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-800 transition-all duration-150">← กลับหน้าหลัก</button>
          ) : (
            <Link href="/welcome" className="text-xl font-bold mb-4 inline-block px-6 py-2 border-4 border-primary-400 bg-white rounded-full shadow-lg text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-800 transition-all duration-150">← กลับหน้าหลัก</Link>
          )
        )}
        <h1 className="game-title">🔢 เกมบวกเลข</h1>
      </div>

      {gameStarted && !gameCompleted && (
        <div className="w-full max-w-2xl card mb-8 bg-white">
          <div className="grid grid-cols-2 gap-4 text-center p-4">
            <div className="flex flex-col items-center justify-center"><p className="text-lg text-primary-500 mb-2">เวลา</p><p className="score-display text-4xl md:text-5xl">{formatTime(totalTime)}</p></div>
            <div className="flex flex-col items-center justify-center"><p className="text-lg text-primary-500 mb-2">ข้อที่</p><p className="score-display text-4xl md:text-5xl">{questionsAnswered}/{MAX_QUESTIONS}</p></div>
          </div>
        </div>
      )}

      {showDemo ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8 border-4 border-success-400 bg-success-50">
            <h2 className="text-3xl font-bold text-success-600 mb-4">📖 ตัวอย่างการเล่น</h2>
             <div className="flex gap-4"><button onClick={closeDemo} className="btn-secondary flex-1">ปิด</button></div>
          </div>
        </div>
      ) : !gameStarted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <div className="flex flex-col gap-4 mb-6">
              <button onClick={() => setDifficulty(1)} className={`btn-primary w-full ${difficulty === 1 ? 'ring-4 ring-primary-300' : 'opacity-80'}`}>เล่นระดับธรรมดา</button>
              <button onClick={() => setDifficulty(2)} className={`btn-secondary w-full ${difficulty === 2 ? 'ring-4 ring-secondary-300' : 'opacity-80'}`}>เล่นระดับยาก</button>
            </div>
            <div className="flex gap-4 flex-col"><button onClick={() => initializeGame()} className="btn-success w-full text-2xl py-4">เริ่มเล่น</button><button onClick={startDemo} className="btn-info w-full text-xl py-2">ดูตัวอย่าง</button></div>
          </div>
        </div>
      ) : gameCompleted ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 เสร็จสิ้น!</h2>
            
            {/* --- ส่วนที่แก้ไข: แสดงรายละเอียดคะแนน --- */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-warning-50 p-6 rounded-xl">
                <p className="text-lg text-warning-600 mb-2 font-bold">ความถูกต้อง</p>
                <p className="text-5xl font-black text-warning-700 mb-2">{successRate}%</p>
                <div className="text-base text-gray-600 space-y-1">
                    <p className="text-green-600 font-bold">✅ ถูก {correctAnswers} ข้อ</p>
                    <p className="text-red-500 font-bold">❌ ผิด {MAX_QUESTIONS - correctAnswers} ข้อ</p>
                    <p className="text-gray-500 text-sm">(จากทั้งหมด {MAX_QUESTIONS} ข้อ)</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-xl flex flex-col items-center justify-center">
                <p className="text-lg text-blue-600 mb-2 font-bold">คะแนนรวม</p>
                <p className="text-6xl font-black text-blue-700">{score}</p>
                <p className="text-sm text-blue-400 mt-2">ใช้เวลา {formatTime(totalTime)}</p>
              </div>
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
                 <button onClick={() => { setDifficulty(nextDifficulty(difficulty)); setTimeout(() => initializeGame(), 100); }} className="btn-secondary flex-1">เล่นระดับ {nextDifficultyLabel(difficulty)}</button>
               </div>
            )}
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="w-full max-w-2xl">
          <div className="card text-center mb-8">
            <div className="text-6xl font-bold text-primary-700 mb-8 p-8 bg-primary-100 rounded-2xl">
              {difficulty === 1 ? `${currentQuestion.num1} ${currentQuestion.operation} ${currentQuestion.num2} = ?` : (currentQuestion.nums ? currentQuestion.nums.join(' + ') + ' = ?' : `${currentQuestion.num1} + ${currentQuestion.num2} = ?`)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button key={index} onClick={() => handleAnswer(option)} disabled={answered} className={`py-6 px-4 text-3xl font-bold rounded-2xl transition-all ${selectedAnswer === option ? option === currentQuestion.correctAnswer ? 'btn-success scale-110' : 'btn-error scale-110' : 'btn-secondary hover:scale-105'} ${answered ? 'opacity-70' : ''}`}>{option}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}