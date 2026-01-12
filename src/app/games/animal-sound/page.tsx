'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateAnimalSounds } from '@/utils/gameUtils'

interface AnimalSound {
  id: string
  name: string
  soundUrl: string
  imageUrl: string
}

export default function AnimalSoundGame() {
  const [currentAnimal, setCurrentAnimal] = useState<AnimalSound | null>(null)
  const [options, setOptions] = useState<AnimalSound[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Set fixed max questions
  const maxQuestions = 10

  // Initialize game
  const initializeGame = () => {
    const { currentAnimal: animal, options: opts } = generateAnimalSounds()
    setCurrentAnimal(animal)
    setOptions(opts)
    setGameStarted(true)
    setGameCompleted(false)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setSoundPlayed(false)
    setTotalTime(0)
  }

  // Load next question
  const loadNextQuestion = () => {
    const { currentAnimal: animal, options: opts } = generateAnimalSounds()
    setCurrentAnimal(animal)
    setOptions(opts)
    setSelectedAnswer(null)
    setAnswered(false)
  }

  // Handle answer
  const handleAnswer = (animalId: string) => {
    if (answered) return

    setSelectedAnswer(animalId)
    setAnswered(true)

    setQuestionsAnswered((prev) => {
      const next = prev + 1

      if (animalId === currentAnimal?.id) {
        setCorrectAnswers((c) => c + 1)
        // score removed per request — no scoring update
      }

      setTimeout(() => {
        if (next < maxQuestions) {
          loadNextQuestion()
        } else {
          setGameCompleted(true)
        }
      }, 1500)

      return next
    })
  }

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // Play sound effect
  const playSound = () => {
    setSoundPlayed(true)
    // In a real app, you would play actual sound files here
  }

  // Initialize demo
  const startDemo = () => {
    const { currentAnimal: animal, options: opts } = generateAnimalSounds()
    setCurrentAnimal(animal)
    setOptions(opts)
    setDemoStep(1)
    setSoundPlayed(false)
    setSelectedAnswer(null)
    setAnswered(false)
    
    // Auto-play the sound after 1 second
    setTimeout(() => {
      setSoundPlayed(true)
      setDemoStep(2)
      
      // Show wrong answer (red) after 1.5 seconds
      setTimeout(() => {
        // Find a wrong answer
        const wrongOption = opts.find(opt => opt.id !== animal.id)
        if (wrongOption) {
          setSelectedAnswer(wrongOption.id)
          setAnswered(true)
          setDemoStep(3)
          
          // After 1.5 seconds, show correct answer (green)
          setTimeout(() => {
            setSelectedAnswer(animal.id)
            setAnswered(true)
            setDemoStep(4)
            // Demo stays open until user clicks close or start button
          }, 1500)
        }
      }, 1500)
    }, 1000)
  }

  // Handle demo steps
  useEffect(() => {
    if (!showDemo || !currentAnimal) return
    
    let timer: ReturnType<typeof setTimeout> | null = null
    
    if (demoStep === 1) {
      timer = setTimeout(() => {
        setSoundPlayed(true)
        setDemoStep(2)
      }, 1000)
    } else if (demoStep === 2 && options.length > 0) {
      timer = setTimeout(() => {
        const wrongOption = options.find(opt => opt.id !== currentAnimal.id)
        if (wrongOption) {
          setSelectedAnswer(wrongOption.id)
          setAnswered(true)
          setDemoStep(3)
        }
      }, 1500)
    } else if (demoStep === 3) {
      timer = setTimeout(() => {
        setSelectedAnswer(currentAnimal.id)
        setAnswered(true)
        setDemoStep(4)
      }, 1500)
    }
    
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [demoStep, showDemo, currentAnimal, options])

  // Start demo when showDemo changes to true
  // --- แก้ไขตรงนี้: เติม => เข้าไป ---
  useEffect(() => {
    if (showDemo && demoStep === 0) {
      const { currentAnimal: animal, options: opts } = generateAnimalSounds()
      setCurrentAnimal(animal)
      setOptions(opts)
      setDemoStep(1)
      setSoundPlayed(false)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }, [showDemo, demoStep])

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex flex-col">
      {/* Header Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary-100 px-6 py-4 md:py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Back Button */}
          <Link href="/welcome" className="btn-primary px-6 py-2 text-lg md:text-xl whitespace-nowrap">
            ← กลับหน้าแรก
          </Link>
          
          {/* Title in Center */}
          <div className="flex items-center gap-2">
            <span className="text-3xl md:text-4xl">🎮</span>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-700">เกมฟังเสียงสัตว์</h1>
          </div>

          {/* Demo Button */}
          <button 
            onClick={() => {
              setDemoStep(0)
              setCurrentAnimal(null)
              setOptions([])
              setSoundPlayed(false)
              setSelectedAnswer(null)
              setAnswered(false)
              setShowDemo(true)
            }}
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 transition-all shadow-lg hover:shadow-xl text-2xl md:text-3xl"
            title="ดูตัวอย่างเกม"
          >
            💡
          </button>
        </div>
      </div>

      {/* Game Stats - shown during gameplay */}
      {gameStarted && !gameCompleted && !showDemo && (
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          <div className="card grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg text-primary-500 mb-2">เวลา</p>
              <p className="score-display">{formatTime(totalTime)}</p>
            </div>
            <div>
              <p className="text-lg text-primary-500 mb-2">ตอบถูก</p>
              <p className="score-display">{correctAnswers}/{questionsAnswered}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        {showDemo && demoStep > 0 && currentAnimal && options.length > 0 ? (
          <div className="w-full max-w-3xl">
            <div className="card text-center border-4 border-yellow-300 bg-yellow-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-yellow-700">🎬 ตัวอย่างการเล่น</h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="text-3xl text-yellow-700 hover:text-yellow-900 font-bold px-4 py-2 hover:bg-yellow-200 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-xl text-primary-600 mb-4 leading-relaxed">
                🎮 เกมนี้จะให้คุณฟังเสียงสัตว์ แล้วเลือกรูปสัตว์ที่ตรงกับเสียง<br/>
                ให้ลองฟังและเลือกรูปเพื่อท่องจำเสียงและรูปสัตว์ต่างๆ
              </p>

              <button
                disabled
                className="btn-primary w-full text-3xl mb-8 bg-primary-400 cursor-default"
              >
                🔊 กำลังเล่นเสียง...
              </button>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {options.map((option) => {
                  let buttonClass = 'btn-secondary'
                  
                  if (demoStep >= 3 && selectedAnswer === option.id) {
                    if (option.id === currentAnimal?.id) {
                      buttonClass = 'btn-success scale-110'
                    } else {
                      buttonClass = 'btn-error scale-110'
                    }
                  }
                  
                  return (
                    <button
                      key={option.id}
                      disabled
                      className={`py-8 px-4 text-6xl rounded-2xl transition-all ${buttonClass}`}
                    >
                      {option.imageUrl}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-4 flex-col md:flex-row">
                <button
                  onClick={() => {
                    setShowDemo(false)
                    setDemoStep(0)
                    setCurrentAnimal(null)
                    setOptions([])
                    setSoundPlayed(false)
                    setSelectedAnswer(null)
                    setAnswered(false)
                    initializeGame()
                  }}
                  className="btn-primary flex-1"
                >
                  เริ่มเล่น
                </button>
                <button
                  onClick={() => setShowDemo(false)}
                  className="btn-secondary flex-1"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        ) : !gameStarted ? (
          <div className="w-full max-w-5xl">
            <div className="card text-center py-32 md:py-48 px-12 md:px-16">
              <h2 className="text-7xl md:text-8xl font-bold text-primary-700 mb-8">ยินดีต้อนรับ!</h2>
              <p className="text-3xl md:text-4xl text-primary-600 mb-16 leading-relaxed">
                ฟังเสียงสัตว์ แล้วเลือกรูปที่ตรงกัน
              </p>

              <button onClick={initializeGame} className="bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white text-3xl md:text-4xl font-bold py-6 md:py-8 px-16 md:px-20 rounded-3xl shadow-lg hover:shadow-xl transition-all w-full">
                เริ่มเล่น
              </button>
            </div>
          </div>
        ) : gameCompleted ? (
          <div className="w-full max-w-3xl">
            <div className="card text-center">
              <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 เสร็จสิ้น!</h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-warning-50 p-6 rounded-xl">
                  <p className="text-lg text-warning-600 mb-2">ความถูกต้อง</p>
                  <p className="text-5xl font-bold text-warning-700">{successRate}%</p>
                </div>
                <div className="bg-success-50 p-6 rounded-xl">
                  <p className="text-lg text-success-600 mb-2">จำนวนสัตว์</p>
                  <p className="text-5xl font-bold text-success-700">{questionsAnswered}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl col-span-2">
                  <p className="text-lg text-blue-600 mb-2">ใช้เวลา</p>
                  <p className="text-5xl font-bold text-blue-700">{formatTime(totalTime)}</p>
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
        ) : currentAnimal && options.length > 0 ? (
          <div className="w-full max-w-3xl">
            <div className="card text-center mb-8">
              <p className="text-2xl text-primary-600 mb-6">ฟังเสียง และเลือกสัตว์</p>

              <button
                onClick={playSound}
                className={`btn-primary w-full text-3xl mb-8 ${soundPlayed ? 'scale-95' : ''}`}
              >
                🔊 {soundPlayed ? 'เล่นเสียง' : 'เล่นเสียง'}
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
      </div>
    </div>
  )
}