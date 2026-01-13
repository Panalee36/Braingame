"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'

// --- 1. ข้อมูลเกมทั้งหมด ---
const ALL_GAMES = [
    { id: 'color-matching', title: 'เกมจับคู่สี', icon: '🎨' },
    { id: 'fast-math', title: 'เกมบวกเลข', icon: '🔢' },
    { id: 'sequential-memory', title: 'เกมจำลำดับภาพ', icon: '🖼️' },
    { id: 'animal-sound', title: 'เกมฟังเสียงสัตว์', icon: '🐕' },
    { id: 'vocabulary', title: 'เกมจำศัพท์', icon: '📚' },
];

export default function DailyQuizPage() {
  const [step, setStep] = useState(0); 
  const [games, setGames] = useState<any[]>([]);
  const [hasPlayedCurrent, setHasPlayedCurrent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  const STORAGE_KEY = 'daily_quiz_progress_v2'; 
  const HISTORY_KEY = 'daily_quiz_completion_history';

  // --- 2. เริ่มต้น: โหลดข้อมูล ---
    useEffect(() => {
        const todayStr = new Date().toDateString();
        try {
            // โหลดประวัติ
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            let currentHistory: string[] = [];
            if (savedHistory) {
                currentHistory = JSON.parse(savedHistory);
                setHistory(currentHistory);
            }

            // คำนวณ Streak
            const sCount = calculateStreak(currentHistory, todayStr);
            setStreakCount(sCount);

            // โหลด Progress วันนี้ (ถ้ามีแล้วใช้ชุดเดิม)
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.date === todayStr) {
                    setGames(parsed.games);
                    setStep(parsed.currentStep || 0);
                    setIsLoaded(true);
                    // ถ้าโหลดมาแล้วพบว่าจบเกมแล้ว (Step 4) ให้จุดพลุโชว์อีกรอบเบาๆ
                    if (parsed.currentStep === 4) {
                        setTimeout(() => runSideCannons(), 500);
                    }
                    return;
                }
            }

            // สุ่มเกมใหม่ (วันละครั้งเท่านั้น)
            // ใช้ seed เป็นวันที่ เพื่อให้สุ่มเหมือนเดิมทั้งวัน
            function seededShuffle(array: any[], seed: string) {
                let arr = [...array];
                let s = 0;
                for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
                for (let i = arr.length - 1; i > 0; i--) {
                    s = (s * 9301 + 49297) % 233280;
                    const j = Math.floor((s / 233280) * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }
            const shuffled = seededShuffle(ALL_GAMES, todayStr);
            // สุ่ม level ด้วย seed เช่นกัน
            function seededLevel(idx: number, seed: string) {
                let s = 0;
                for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i) * (idx + 1);
                return (s % 3) + 1;
            }
            const newDailyGames = shuffled.slice(0, 3).map((game, idx) => ({
                ...game,
                level: seededLevel(idx, todayStr),
            }));

            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                date: todayStr,
                games: newDailyGames,
                currentStep: 0
            }));
            setGames(newDailyGames);
            setStep(0);
            setIsLoaded(true);
        } catch (error) {
            console.error("Error loading:", error);
            setGames(ALL_GAMES.slice(0, 3));
            setIsLoaded(true);
        }
    }, []);

  // --- ฟังก์ชันคำนวณ Streak ---
  const calculateStreak = (historyList: string[], todayStr: string) => {
    let count = 0;
    const today = new Date(todayStr);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let checkDate = historyList.includes(todayStr) ? today : yesterday;

    for (let i = 0; i < 365; i++) {
        if (historyList.includes(checkDate.toDateString())) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return count;
  };

  // --- 3. เอฟเฟกต์พลุสวยงาม (Fireworks) ---
  const runFireworks = () => {
    const duration = 3 * 1000; // เล่นนาน 3 วินาที
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      // ยิงพลุจากจุดสุ่มซ้ายและขวา
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // --- เอฟเฟกต์ยิงจากด้านข้าง (Side Cannons) ---
  const runSideCannons = () => {
    const end = Date.now() + (1 * 1000);
    const colors = ['#bb0000', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // --- 4. บันทึกความคืบหน้า ---
    const updateProgress = (newStep: number) => {
        const todayStr = new Date().toDateString();
        // sync games/step จาก localStorage เป็นหลัก
        let gamesToUse = games;
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.date === todayStr) {
                gamesToUse = parsed.games;
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayStr,
            games: gamesToUse,
            currentStep: newStep
        }));
        setStep(newStep);
        setGames(gamesToUse);

        if (newStep === 4) {
            const newHistory = [...history];
            if (!newHistory.includes(todayStr)) {
                newHistory.push(todayStr);
                setHistory(newHistory);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
                const newStreak = calculateStreak(newHistory, todayStr);
                setStreakCount(newStreak);
                runFireworks();
            }
        }
    };

  // --- 5. จัดการปุ่ม ---
    const router = useRouter();
    const handleOpenGame = () => {
        if (step > 0 && step <= 3) {
            const currentGame = games[step - 1];
            router.push(`/games/${currentGame.id}?level=${currentGame.level}&mode=daily`);
            setHasPlayedCurrent(true);
        }
    };

    const handleNextStep = () => {
        const nextStep = step + 1;
        updateProgress(nextStep);
        setHasPlayedCurrent(false);
    };

  // --- Component: 7-Day Streak Bar ---
  const renderStreakBar = () => {
    const todayStr = new Date().toDateString();
    const isTodayDone = history.includes(todayStr);
    
    let currentDayInCycle = (streakCount % 7);
    if (currentDayInCycle === 0 && streakCount > 0 && isTodayDone) currentDayInCycle = 7; 
    if (!isTodayDone) currentDayInCycle += 1;
    if (currentDayInCycle > 7) currentDayInCycle = 1;

    return (
        <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm mb-6 w-full transform transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">📅 สะสมความต่อเนื่อง</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${streakCount > 0 ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    🔥 {streakCount} วัน
                </span>
            </div>
            
            <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 rounded-full"></div>
                
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    let status = 'locked'; 
                    if (day < currentDayInCycle) status = 'done';
                    else if (day === currentDayInCycle) status = isTodayDone ? 'done' : 'current';

                    return (
                        <div key={day} className="flex flex-col items-center relative z-10">
                            <div className={`
                                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 text-sm md:text-base font-bold transition-all duration-500
                                ${status === 'done' ? 'bg-green-500 border-green-200 text-white shadow-lg scale-110' : ''}
                                ${status === 'current' ? 'bg-white border-orange-400 text-orange-600 shadow-xl scale-125 animate-bounce-slow' : ''}
                                ${status === 'locked' ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                            `}>
                                {day === 7 ? <span className="text-lg">🎁</span> : (status === 'done' ? '✓' : day)}
                            </div>
                            <span className={`text-[10px] md:text-xs mt-1 font-medium ${status === 'current' ? 'text-orange-600' : 'text-gray-400'}`}>
                                {day === 7 ? 'รางวัล' : `วันที่ ${day}`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // --- 6. Render ---
  if (!isLoaded) return <div className="p-10 text-center text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 font-sans overflow-hidden">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-blue-100 relative z-10">
            
            {/* STEP 0: หน้าแรก */}
            {step === 0 && (
                <div className="text-center animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">ภารกิจประจำวัน</h1>
                    <p className="text-gray-600 mb-6">ฝึกสมองวันละนิด จิตแจ่มใส</p>

                    {renderStreakBar()}

                    <div className="space-y-3 mb-8 text-left bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <p className="font-bold text-gray-700 ml-1 mb-2">🎮 เกมวันนี้:</p>
                        {games.map((game, index) => (
                            <div key={index} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-blue-100 mb-3 last:mb-0 transform transition hover:scale-[1.01]">
                                <span className="text-3xl mr-4">{game.icon}</span>
                                <div>
                                    <div className="font-bold text-gray-800 text-lg">{game.title}</div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded">
                                            ระดับ {game.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleNextStep}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-95"
                    >
                        🚀 เริ่มทำภารกิจ
                    </button>
                    
                    <div className="mt-6">
                        <Link href="/welcome" className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                            กลับหน้าหลัก
                        </Link>
                    </div>
                </div>
            )}

            {/* STEP 1-3: เล่นเกม */}
            {step > 0 && step <= 3 && (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-gray-400 tracking-wider">DAILY QUEST</span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="py-6">
                        <div className="text-9xl mb-6 transform transition-transform hover:scale-110 cursor-default animate-bounce-gentle">
                            {games[step-1].icon}
                        </div>
                        <h2 className="text-4xl font-bold text-blue-900 mb-2">{games[step-1].title}</h2>
                        <p className="text-gray-500 mb-8">ความยากระดับ {games[step-1].level}</p>

                        <div className="space-y-4 max-w-sm mx-auto">
                            {!hasPlayedCurrent ? (
                                <>
                                    <button
                                        onClick={handleOpenGame}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-2xl shadow-lg ring-4 ring-blue-50 transition-all"
                                    >
                                        ▶️ เล่นเกม
                                    </button>
                                    <p className="text-sm text-gray-400 mt-2">
                                        (หน้าต่างใหม่จะเปิดขึ้น)
                                    </p>
                                </>
                            ) : (
                                <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 animate-pop-in shadow-md">
                                    <h3 className="text-green-800 font-bold text-lg mb-3">ยอดเยี่ยมครับ!</h3>
                                    <button
                                        onClick={handleNextStep}
                                        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-xl shadow-md transition-transform hover:scale-105"
                                    >
                                        {step < 3 ? 'ไปด่านถัดไป ➜' : 'รับรางวัล 🏆'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: จบเกม (หน้าจอสวยงาม) */}
            {step === 4 && (
                <div className="text-center py-8 relative">
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-orange-100/50 blur-3xl rounded-full -z-10 animate-pulse"></div>

                    <div className="text-9xl mb-4 animate-bounce drop-shadow-lg">
                        {streakCount % 7 === 0 ? '🎁' : '🎉'}
                    </div>
                    
                    <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-600 mb-2 animate-scale-in">
                        ภารกิจสำเร็จ!
                    </h2>
                    
                    <p className="text-xl text-gray-600 mb-8 animate-fade-in-up delay-100">
                        คุณทำภารกิจวันนี้เสร็จสมบูรณ์แล้ว<br/>
                        สะสมต่อเนื่อง: <span className="text-orange-600 font-bold text-2xl">{streakCount} วัน</span>
                    </p>
                    
                    {/* Bonus Card */}
                    <div className="bg-gradient-to-b from-yellow-50 to-orange-50 p-8 rounded-3xl border-2 border-orange-100 mb-10 mx-auto max-w-xs shadow-xl transform transition hover:-translate-y-2 hover:shadow-2xl animate-pop-in delay-200">
                        <p className="text-orange-800 font-bold text-lg uppercase tracking-wide">
                            {streakCount % 7 === 0 ? 'โบนัสกล่องใหญ่' : 'โบนัสประจำวัน'}
                        </p>
                        <div className="text-6xl font-black text-orange-500 mt-4 tracking-tighter drop-shadow-sm">
                             {streakCount % 7 === 0 ? '+500' : '+150'}
                        </div>
                        <div className="text-sm text-orange-600 font-medium mt-1">คะแนนสะสม</div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('daily_quiz_progress_v2');
                            localStorage.removeItem('daily_quiz_completion_history');
                            window.location.reload();
                        }}
                        className="inline-block w-full md:w-auto px-12 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg mb-4"
                    >
                        🔄 เล่นใหม่ทั้งชุด
                    </button>

                    <Link 
                        href="/welcome"
                        className="inline-block w-full md:w-auto px-12 py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-900 transition shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
                    >
                        กลับหน้าหลัก
                    </Link>
                </div>
            )}
        </div>
    </div>
  );
}