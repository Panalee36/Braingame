'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { generateSequentialImages, saveGameHistory } from '@/utils/gameUtils'

interface SequentialImageItem {
  id: string
  imageUrl: string
  label: string
  order: number
}

export default function SequentialMemoryGame() {
  // --- 1. เช็ค Mode และ Level ---
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);

  const [images, setImages] = useState<SequentialImageItem[]>([]);
  const [showImages, setShowImages] = useState(true);
  const [shuffledImages, setShuffledImages] = useState<SequentialImageItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(SequentialImageItem | null)[]>([]);
  const [score, setScore] = useState(0);
  
  // ใช้ค่าจาก URL เป็นค่าเริ่มต้นของ difficulty
  const [difficulty, setDifficulty] = useState(levelFromQuery);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [displayTimer, setDisplayTimer] = useState(15);
  const [showDisplayTimer, setShowDisplayTimer] = useState(false);

  // Shuffle helper
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Initialize game
  const initializeGame = () => {
    // ธรรมดา 6 รูป, ยาก 10 รูป
    const imageCount = difficulty === 2 ? 9 : 6;
    const newImagesRaw = generateSequentialImages(difficulty, imageCount);
    // Ensure imageUrl is always string, and has label/order
    const newImages: SequentialImageItem[] = newImagesRaw.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl ?? '',
      label: img.label ?? '',
      order: img.order ?? 0,
    }));
    setImages(newImages);
    setShowImages(true);
    setSelectedOrder(Array(newImages.length).fill(null));
    setScore(0);
    setGameStarted(true);
    setGameCompleted(false);
    setTimeElapsed(0);
    setDisplayTimer(15);
    setShowDisplayTimer(true);
    setShuffledImages([]);
  };

  // --- 2. Auto Start Effect ---
  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame();
    }
  }, [isDailyMode]);

  // Display timer effect
  useEffect(() => {
    if (!gameStarted || !showDisplayTimer) return;
    const timer = setInterval(() => {
      setDisplayTimer((prev) => {
        if (prev <= 1) {
          setShowImages(false);
          setShowDisplayTimer(false);
          setShuffledImages(shuffleArray(images));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, showDisplayTimer, images]);

  // Main timer effect
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameCompleted]);

  // Handle image selection
  const handleImageClick = (image: SequentialImageItem) => {
    if (showImages || gameCompleted) return;
    const firstEmpty = selectedOrder.findIndex((img) => !img);
    if (firstEmpty === -1) return;
    const newSelected = [...selectedOrder];
    newSelected[firstEmpty] = image;
    setSelectedOrder(newSelected);
  };

  const handleRemoveFromSlot = (idx: number) => {
    if (showImages || gameCompleted) return;
    const newSelected = [...selectedOrder];
    newSelected[idx] = null;
    setSelectedOrder(newSelected);
  };

  const handleCheckAnswer = () => {
    const correctCount = selectedOrder.filter(
      (img, idx) => img && img.id === images[idx].id
    ).length;
    setScore(correctCount);
    setGameCompleted(true);
  };

  const total = images.length;
  const score100 = useMemo(
    () => (total > 0 ? Math.round((score / total) * 100) : 0),
    [score, total]
  );

  // Save play history when game completed
  useEffect(() => {
    if (!gameCompleted) return;
    const username = localStorage.getItem('profile_username');
    if (username) {
      saveGameHistory(`sequential-memory_${username}`, score100);
      try {
        const key = `stat_sequential-memory_${username}`;
        const raw = localStorage.getItem(key);
        let prev = { gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-' };
        if (raw) prev = JSON.parse(raw);
        const newGamesPlayed = prev.gamesPlayed + 1;
        const newAverageScore = Math.round((prev.averageScore * prev.gamesPlayed + score100) / newGamesPlayed);
        const newHighScore = Math.max(prev.highScore, score100);
        const newLastPlayed = new Date().toISOString().slice(0, 10);
        localStorage.setItem(key, JSON.stringify({ gamesPlayed: newGamesPlayed, averageScore: newAverageScore, highScore: newHighScore, lastPlayed: newLastPlayed }));
      } catch {}
    }
  }, [gameCompleted, score100]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        {!isDailyMode && (
          (gameStarted || gameCompleted) ? (
            <button
              onClick={() => {
                setGameStarted(false);
                setGameCompleted(false);
                setScore(0);
                setSelectedOrder([]);
                setShowImages(true);
                setTimeElapsed(0);
                setDisplayTimer(15);
                setShowDisplayTimer(false);
                setImages([]);
                setShuffledImages([]);
              }}
              className="text-xl font-bold mb-4 inline-block px-6 py-2 border-4 border-primary-400 bg-white rounded-full shadow-lg text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-800 transition-all duration-150"
            >
              ← กลับหน้าแรก
            </button>
          ) : (
            <Link
              href="/welcome"
              className="text-xl font-bold mb-4 inline-block px-6 py-2 border-4 border-primary-400 bg-white rounded-full shadow-lg text-primary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-800 transition-all duration-150"
            >
              ← กลับหน้าแรก
            </Link>
          )
        )}
        <h1 className="game-title">🖼️ เกมจำลำดับภาพ</h1>
      </div>

      {!gameStarted ? (
        <div className="w-full max-w-4xl">
          <div className="card text-center mb-8">
            <h2 className="text-4xl font-bold text-primary-700 mb-6">ยินดีต้อนรับ!</h2>
            <p className="text-2xl text-primary-600 mb-8">
              เลือกระดับที่ต้องการเล่น
            </p>
            <div className="flex flex-col gap-4 mb-6">
              <button
                onClick={() => setDifficulty(1)}
                className={`btn-primary w-full ${difficulty === 1 ? 'ring-2 ring-primary-400' : ''}`}
              >
                ธรรมดา
              </button>
              <button
                onClick={() => setDifficulty(2)}
                className={`btn-secondary w-full ${difficulty === 2 ? 'ring-2 ring-secondary-400' : ''}`}
              >
                ยาก
              </button>
            </div>
            <button onClick={initializeGame} className="btn-success w-full text-2xl py-4">
              เริ่มเล่น
            </button>
          </div>
        </div>
      ) : gameCompleted ? (
        // --- 3. UI หน้าจบเกมแบบใหม่ ---
        <div className="w-full max-w-4xl text-center py-12 card bg-white animate-fade-in">
          <h2 className="text-5xl font-bold text-success-600 mb-6">🎉 ยินดีด้วย!</h2>
          <p className="text-3xl text-primary-600 mb-8">
            คุณจำลำดับได้สำเร็จ!
          </p>
          <div className="flex flex-col items-center justify-center mb-8">
            <span className="text-2xl text-primary-700 font-bold">คะแนนที่ได้</span>
            <span className="text-5xl font-bold text-success-700 mt-2 mb-2">{score100} / 100</span>
          </div>
          <p className="text-2xl text-warning-600 mb-8">ใช้เวลา {timeElapsed}s</p>
          
          {isDailyMode ? (
            // ปุ่มสำหรับ Daily Mode
            <div className="flex justify-center">
                 <button 
                  onClick={() => window.close()} 
                  className="w-full max-w-md py-4 bg-red-500 hover:bg-red-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  ❌ ปิดหน้าต่าง (รับรางวัล)
                </button>
            </div>
          ) : (
            // ปุ่มสำหรับโหมดปกติ
            <div className="flex gap-4 flex-col md:flex-row justify-center">
              {difficulty === 1 && (
                <button
                  onClick={() => {
                    setDifficulty(2);
                    setTimeout(() => initializeGame(), 100);
                  }}
                  className="btn-success flex-1 max-w-xs"
                >
                  ถัดไป (ยาก)
                </button>
              )}
            </div>
          )}
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

          {showImages ? (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-2xl text-[6rem] flex items-center justify-center bg-white border-4 border-primary-500"
                >
                  {image.imageUrl && image.imageUrl.startsWith("/memory-images/") ? (
                    <img
                      src={image.imageUrl}
                      alt={image.label}
                      className="w-24 h-24 object-contain"
                    />
                  ) : (
                    <span>{image.imageUrl}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ช่องว่างสำหรับวางไพ่ */}
              <div className="flex gap-4 justify-center mb-8">
                {Array.from({ length: images.length }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square w-24 h-24 rounded-2xl flex items-center justify-center border-2 cursor-pointer ${
                      selectedOrder[idx]
                        ? "bg-white border-success-400 hover:bg-red-50"
                        : "bg-gray-100 border-gray-300"
                    }`}
                    onClick={() =>
                      selectedOrder[idx] && handleRemoveFromSlot(idx)
                    }
                  >
                    {selectedOrder[idx] ? (
                      selectedOrder[idx]?.imageUrl &&
                      selectedOrder[idx]?.imageUrl.startsWith("/memory-images/") ? (
                        <img
                          src={selectedOrder[idx]!.imageUrl}
                          alt={selectedOrder[idx]!.label}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <span className="text-5xl">
                          {selectedOrder[idx]?.imageUrl}
                        </span>
                      )
                    ) : null}
                  </div>
                ))}
              </div>

              {/* แถวไพ่ shuffled */}
              <div className="flex gap-4 justify-center mb-8">
                {shuffledImages
                  .filter(
                    (img) =>
                      !selectedOrder.some(
                        (sel) => sel && sel.id === img.id
                      )
                  )
                  .map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleImageClick(image)}
                      className="aspect-square w-24 h-24 rounded-2xl text-5xl flex items-center justify-center transition-all border-2 bg-white border-primary-300 hover:scale-105 hover:bg-primary-100"
                    >
                      {image.imageUrl &&
                      image.imageUrl.startsWith("/memory-images/") ? (
                        <img
                          src={image.imageUrl}
                          alt={image.label}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <span>{image.imageUrl}</span>
                      )}
                    </button>
                  ))}
              </div>

              {/* ปุ่มตรวจคำตอบ */}
              <div className="flex justify-center mb-4">
                <button
                  className="btn-primary px-8 py-2 text-xl font-bold rounded-xl disabled:opacity-50"
                  onClick={handleCheckAnswer}
                  disabled={selectedOrder.filter(Boolean).length !== images.length}
                >
                  ส่งคำตอบ
                </button>
              </div>

              <div className="text-center">
                <p className="text-xl text-primary-700 font-bold">
                  เลือกไพ่ตามลำดับที่จำได้
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <footer className="text-center text-lg text-primary-600 mt-8">
        <p>เล่นเกมสม่ำเสมอเพื่อกระตุ้นสมองของคุณ</p>
      </footer>
    </div>
  );
}