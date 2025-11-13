'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateSequentialImages, calculateScore, getTimeLimit } from '@/utils/gameUtils'

interface SequentialImageItem {
  id: string
  imageUrl: string
  label: string
  order: number
}

export default function SequentialMemoryGame() {
  const [images, setImages] = useState<SequentialImageItem[]>([])
  const [showImages, setShowImages] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<SequentialImageItem[]>([])
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300)
  const [totalTime, setTotalTime] = useState(0)
  const [displayTimer, setDisplayTimer] = useState(5)
  const [showDisplayTimer, setShowDisplayTimer] = useState(false)

  // Initialize game
  const initializeGame = () => {
    const newImages = generateSequentialImages(difficulty)
    setImages(newImages)
    setShowImages(true)
    setSelectedOrder([])
    setScore(0)
    setGameStarted(true)
    setGameCompleted(false)
    setTimeRemaining(getTimeLimit('sequential-memory', difficulty))
    setTotalTime(0)
    setDisplayTimer(5)
    setShowDisplayTimer(true)
  }

  // Display timer effect
  useEffect(() => {
    if (!gameStarted || !showDisplayTimer) return

    const timer = setInterval(() => {
      setDisplayTimer((prev: number) => {
        if (prev <= 1) {
          setShowImages(false)
          setShowDisplayTimer(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, showDisplayTimer])

  // Main timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev: number) => {
        if (prev <= 1) {
          setGameCompleted(true)
          return 0
        }
        return prev - 1
      })
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // Handle image selection
  const handleImageClick = (image: SequentialImageItem) => {
    if (showImages || selectedOrder.some((img) => img.id === image.id)) return

    const newSelected = [...selectedOrder, image]
    setSelectedOrder(newSelected)

    // Check if correct
    if (image.order === newSelected.length - 1) {
      const allMatched = images.length === newSelected.length
      if (allMatched) {
        setScore(score + calculateScore(images.length, images.length, totalTime, difficulty))
        setGameCompleted(true)
      } else {
        setScore(score + (10 + difficulty * 2))
      }
    } else {
      // Wrong order
      setSelectedOrder([])
      setScore(Math.max(0, score - 5))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← กลับหน้าแรก
        </Link>
        <h1 className="game-title">🖼️ เกมจำลำดับภาพ</h1>
      </div>

      {/* Game Stats */}
      <div className="w-full max-w-4xl card mb-8 bg-white">
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
            <p className="text-lg text-primary-500 mb-2">จำได้</p>
            <p className="score-display">
              {selectedOrder.length}/{images.length}
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
        <div className="w-full max-w-4xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">
              ดูรูปภาพ 5 วินาที แล้วจำลำดับของมัน
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
        <div className="w-full max-w-4xl">
          <div className="card text-center">
            <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
            <p className="text-3xl text-primary-600 mb-8">
              คุณจำลำดับได้สำเร็จ!
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
        <div className="w-full max-w-4xl">
          {showDisplayTimer && (
            <div className="card text-center mb-8 bg-warning-100 border-4 border-warning-500">
              <p className="text-4xl font-bold text-warning-700 mb-4">
                จำรูปภาพด้วย!
              </p>
              <p className="text-6xl font-bold text-warning-600 animate-bounce-gentle">
                {displayTimer}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-8">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(image)}
                disabled={showImages || selectedOrder.some((img) => img.id === image.id)}
                className={`aspect-square rounded-2xl text-6xl flex items-center justify-center transition-all ${
                  showImages
                    ? 'bg-white border-4 border-primary-500 hover:scale-105'
                    : selectedOrder.some((img) => img.id === image.id)
                      ? 'bg-success-200 border-4 border-success-500 opacity-70'
                      : 'bg-primary-100 border-4 border-primary-400 hover:scale-105 hover:bg-primary-200'
                }`}
              >
                {image.imageUrl}
              </button>
            ))}
          </div>

          {!showImages && (
            <div className="card text-center bg-blue-50">
              <p className="text-2xl font-bold text-primary-700">
                เลือกลำดับที่คุณจำได้
              </p>
              {selectedOrder.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {selectedOrder.map((image, index) => (
                    <div
                      key={image.id}
                      className="bg-white p-4 rounded-lg border-2 border-success-500"
                    >
                      <p className="text-4xl mb-2">{image.imageUrl}</p>
                      <p className="text-xl font-bold text-primary-700">ที่ {index + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-lg text-primary-600 mt-8">
        <p>เล่นเกมสม่ำเสมอเพื่อกระตุ้นสมองของคุณ</p>
      </footer>
    </div>
  )
}
