'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'

// --- ข้อมูลเกม (คงเดิม) ---
const ALL_GAMES = [
    { id: 'color-matching', title: 'เกมจับคู่สี', icon: '🎨' },
    { id: 'fast-math', title: 'เกมบวกเลข', icon: '🔢' },
    { id: 'sequential-memory', title: 'เกมจำลำดับภาพ', icon: '🖼️' },
    { id: 'animal-sound', title: 'เกมฟังเสียงสัตว์', icon: '🐕' },
    { id: 'vocabulary', title: 'เกมจำศัพท์', icon: '📚' },
];

// --- ☁️ ธีมพื้นหลังก้อนเมฆ (Cloud Theme) - ส่วนที่เพิ่มเข้ามา ---
const PerfectCloudTheme = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#7EC8FF]">
      {/* ไล่สีท้องฟ้า */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#CDE8FE]"></div>

      {/* เมฆลอย */}
      <svg className="absolute top-[8%] left-[5%] w-32 text-white/30 animate-float-slow" viewBox="0 0 120 60" fill="currentColor">
         <path d="M10,40 Q20,15 45,25 Q60,10 80,20 Q100,15 110,35 Q115,50 100,55 H15 Q5,50 10,40 Z" />
      </svg>
      <svg className="absolute top-[12%] right-[5%] w-24 text-white/20 animate-float-delayed" viewBox="0 0 120 60" fill="currentColor">
         <path d="M10,35 Q30,10 55,20 Q80,5 100,25 Q110,45 95,50 H10 Z" />
      </svg>

      {/* พื้นเมฆด้านล่าง */}
      <div className="absolute bottom-0 w-full h-[40%] pointer-events-none">
         <svg className="absolute bottom-0 w-full h-full text-white/30 transform scale-y-110 origin-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,213.3C672,203,768,149,864,138.7C960,128,1056,160,1152,181.3C1248,203,1344,213,1392,218.7L1440,224V320H0Z"></path>
         </svg>
         <svg className="absolute bottom-0 w-full h-[80%] text-white/60 transform scale-105 origin-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
             <path d="M0,256L48,245.3C96,235,192,213,288,197.3C384,181,480,171,576,186.7C672,203,768,245,864,240C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192V320H0Z"></path>
         </svg>
         <svg className="relative w-full h-[60%] text-white block drop-shadow-md" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,181.3C672,171,768,181,864,197.3C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128V320H0Z"></path>
         </svg>
      </div>
    </div>
  );
};

export default function DailyQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [games, setGames] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [showCard, setShowCard] = useState(false); // เพิ่ม State สำหรับ Animation

  const STORAGE_KEY = 'daily_quiz_progress_v2';
  const HISTORY_KEY = 'daily_quiz_completion_history';
  const CYCLE_KEY = 'daily_quiz_cycle_start_date';

  // --- 1. เริ่มต้น: โหลดข้อมูลและเช็ครอบวัน ---
  useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const todayStr = today.toDateString();
        
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
        function seededLevel(idx: number, seed: string) {
            let s = 0;
            for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i) * (idx + 1);
            return (s % 3) + 1;
        }

        try {
            // 1. โหลดประวัติ
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            let currentHistory: string[] = [];
            if (savedHistory) {
                currentHistory = JSON.parse(savedHistory);
                setHistory(currentHistory);
            }
            // *หมายเหตุ: calculateStreak จะถูกเรียกใช้ได้เพราะ useEffect ทำงานหลัง render (Hoisting)*
            setStreakCount(calculateStreak(currentHistory, todayStr));

            // 2. ✅ แก้ไข Logic รีเซ็ตรอบ 7 วัน (ส่วนที่เพิ่ม)
            let savedCycleStart = localStorage.getItem(CYCLE_KEY);
            
            if (!savedCycleStart) {
                savedCycleStart = todayStr;
                localStorage.setItem(CYCLE_KEY, savedCycleStart);
            } else {
                const start = new Date(savedCycleStart);
                const diffTime = today.getTime() - start.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

                // ถ้าผ่านไป 7 วันขึ้นไป -> รีเซ็ตใหม่
                if (diffDays >= 7 || diffDays < 0) {
                    savedCycleStart = todayStr;
                    localStorage.setItem(CYCLE_KEY, savedCycleStart);
                }
            }
            setCycleStartDate(savedCycleStart);

            // 3. โหลด/สุ่มเกม (คงเดิม)
            let currentGames = [];
            let currentStep = 0;
            const savedData = localStorage.getItem(STORAGE_KEY);
            
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed.date === todayStr) {
                    currentGames = parsed.games;
                    currentStep = parsed.currentStep || 0;
                } else {
                    const shuffled = seededShuffle(ALL_GAMES, todayStr);
                    currentGames = shuffled.slice(0, 3).map((game, idx) => ({ ...game, level: seededLevel(idx, todayStr) }));
                }
            } else {
                const shuffled = seededShuffle(ALL_GAMES, todayStr);
                currentGames = shuffled.slice(0, 3).map((game, idx) => ({ ...game, level: seededLevel(idx, todayStr) }));
            }

            // 4. เช็ค State การกลับมาจากเกม (คงเดิม แต่เพิ่ม Animation Trigger)
            const action = searchParams.get('action');
            const playedStepStr = searchParams.get('playedStep');
            const playedStep = playedStepStr ? parseInt(playedStepStr, 10) : -1;
            
            if (action === 'next' && playedStep === currentStep && currentStep < 4) {
                const nextStep = currentStep + 1;
                currentStep = nextStep;

                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    date: todayStr,
                    games: currentGames,
                    currentStep: nextStep
                }));

                if (nextStep === 4) {
                    if (!currentHistory.includes(todayStr)) {
                        const newHistory = [...currentHistory, todayStr];
                        setHistory(newHistory);
                        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
                        
                        // คำนวณ Streak ใหม่เพื่อใช้กำหนดคะแนนโบนัส
                        const newStreak = calculateStreak(newHistory, todayStr);
                        setStreakCount(newStreak);
                        
                        // ✅ [เพิ่มใหม่] บันทึกคะแนนโบนัสลง Database
                        const userId = localStorage.getItem('userId');
                        if (userId) {
                            const bonusPoints = (newStreak % 7 === 0) ? 500 : 150;
                            fetch('/api/game/history', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: userId,
                                    gameType: 'daily-quiz-bonus', // ระบุว่าเป็นโบนัสประจำวัน
                                    score: bonusPoints
                                })
                            })
                            .then(res => res.json())
                            .then(data => console.log('Daily bonus saved:', data))
                            .catch(err => console.error('Error saving bonus:', err));
                        }

                        setTimeout(() => runFireworks(), 500);
                        setTimeout(() => setShowCard(true), 100); // Trigger Animation
                    }
                }
                router.replace('/games/daily-quiz');
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    date: todayStr,
                    games: currentGames,
                    currentStep: currentStep
                }));
            }

            setGames(currentGames);
            setStep(currentStep);
            setIsLoaded(true);
            if(currentStep === 4) setTimeout(() => setShowCard(true), 100);

        } catch (error) {
            console.error("Error loading:", error);
            setGames(ALL_GAMES.slice(0, 3));
            setIsLoaded(true);
        }
    }, [searchParams, router]);

  // (ฟังก์ชัน calculateStreak, runFireworks, runSideCannons คงเดิม)
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
        } else { break; }
    }
    return count;
  };

  const runFireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const runSideCannons = () => {
    const end = Date.now() + (1 * 1000);
    const colors = ['#bb0000', '#ffffff'];
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleStartMission = () => {
        const nextStep = 1;
        setStep(nextStep);
        const todayStr = new Date().toDateString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: todayStr,
            games: games,
            currentStep: nextStep
        }));
    };

    const handleOpenGame = () => {
        if (step > 0 && step <= 3) {
            const currentGame = games[step - 1];
            router.push(`/games/${currentGame.id}?level=${currentGame.level}&mode=daily&dailyStep=${step}`);
        }
    };

  // --- Render Bar: ปรับให้เป็นปฏิทิน (Calendar Style) ตามคำขอ ---
  const renderTimeBasedBar = () => {
    if (!cycleStartDate) return null;

    const start = new Date(cycleStartDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const historyTimes = history.map(d => new Date(d).setHours(0,0,0,0));

    // ชื่อวันภาษาไทย
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border-2 border-white shadow-sm mb-6 w-full transform transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">📅 รอบภารกิจ 7 วัน</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${streakCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                    🔥 ต่อเนื่อง {streakCount} วัน
                </span>
            </div>
            
            <div className="flex justify-between items-center relative px-2">
                {/* เส้นเชื่อม (Progress Line) */}
                <div className="absolute top-[1.25rem] left-0 w-full h-1.5 bg-gray-100 -z-0 rounded-full"></div>
                
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const targetDate = new Date(start);
                    targetDate.setDate(targetDate.getDate() + offset);
                    targetDate.setHours(0,0,0,0);
                    
                    const targetTime = targetDate.getTime();
                    const todayTime = today.getTime();
                    const isPlayed = historyTimes.includes(targetTime);
                    
                    // ใช้เลขลำดับ 1-7 แทนวันที่
                    const dayNumber = offset + 1; // 1, 2, 3, 4, 5, 6, 7
                    const dayIndex = targetDate.getDay(); // 0-6
                    const dayName = thaiDays[dayIndex];   // อา., จ.

                    let status = 'locked'; 
                    if (targetTime < todayTime) status = isPlayed ? 'done' : 'missed'; 
                    else if (targetTime === todayTime) status = isPlayed ? 'done' : 'current';

                    return (
                        <div key={offset} className="flex flex-col items-center relative z-10 w-1/7">
                            {/* วงกลมวันที่ */}
                            <div className={`
                                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-[3px] text-sm md:text-base font-bold transition-all duration-500 mb-1
                                ${status === 'done' ? 'bg-green-500 border-green-200 text-white shadow-md scale-105' : ''}
                                ${status === 'missed' ? 'bg-rose-500 border-rose-200 text-white shadow-sm' : ''}
                                ${status === 'current' ? 'bg-white border-blue-500 text-blue-600 shadow-xl ring-4 ring-blue-100 scale-110' : ''}
                                ${status === 'locked' ? 'bg-white border-gray-200 text-gray-400' : ''}
                            `}>
                                {/* เงื่อนไขการแสดงผลในวงกลม */}
                                {status === 'done' && '✓'}
                                {status === 'missed' && dayNumber} {/* พลาดแล้วก็ยังโชว์เลขลำดับให้รู้ */}
                                {status === 'current' && dayNumber}
                                {status === 'locked' && (offset === 6 ? '🎁' : dayNumber)}
                            </div>

                            {/* ข้อความชื่อวันด้านล่าง (จ., อ., พ.) */}
                            <span className={`text-[10px] md:text-xs font-medium 
                                ${status === 'current' ? 'text-blue-600 font-bold' : 
                                  status === 'missed' ? 'text-rose-400' : 
                                  status === 'done' ? 'text-green-600' : 'text-gray-400'}`}>
                                {dayName}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold bg-blue-50">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* ใส่ Theme ก้อนเมฆ (ส่วน UI ที่เปลี่ยน) */}
        <PerfectCloudTheme />

        <div className="w-full max-w-3xl relative z-10">
            
            {/* Step 0: Dashboard หน้าแรก */}
            {step === 0 && (
                <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-xl p-6 md:p-8 border-4 border-white animate-fade-in-up">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-black text-[#1e3a8a] mb-2 tracking-tight">ภารกิจประจำวัน</h1>
                        <p className="text-slate-500">ฝึกสมองวันละนิด จิตแจ่มใส</p>
                    </div>

                    {renderTimeBasedBar()}

                    <div className="space-y-3 mb-8 text-left bg-blue-50/80 p-6 rounded-2xl border border-blue-100">
                        <p className="font-bold text-slate-700 ml-1 mb-2 flex items-center gap-2">🎮 เกมวันนี้:</p>
                        {games.map((game, index) => (
                            <div key={index} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-blue-50 mb-3 last:mb-0">
                                <span className="text-4xl mr-4 bg-blue-50 p-2 rounded-xl">{game.icon}</span>
                                <div>
                                    <div className="font-bold text-slate-800 text-lg">{game.title}</div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full">
                                            ระดับ {game.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleStartMission}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                    >
                        🚀 เริ่มทำภารกิจ
                    </button>
                    
                    <div className="mt-6 text-center">
                        <Link href="/welcome" className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm">
                            ⬅ กลับหน้าหลัก
                        </Link>
                    </div>
                </div>
            )}

            {/* Step 1-3: หน้าเล่นเกม */}
            {step > 0 && step <= 3 && (
                <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-xl p-8 border-4 border-white text-center animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-sm font-black text-slate-300 tracking-wider uppercase">DAILY QUEST</span>
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-3 w-10 rounded-full transition-all ${i <= step ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="py-4">
                        <div className="inline-block p-6 bg-blue-50 rounded-full mb-6 shadow-inner animate-bounce-slow">
                            <div className="text-8xl">{games[step-1].icon}</div>
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 mb-2">{games[step-1].title}</h2>
                        <p className="text-slate-500 mb-10 font-medium">ความยากระดับ {games[step-1].level}</p>

                        <button
                            onClick={handleOpenGame}
                            className="w-full max-w-sm py-5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-2xl font-bold rounded-2xl shadow-xl border-b-[6px] border-[#1D4ED8] active:border-b-0 active:translate-y-1.5 transition-all"
                        >
                            ▶️ เล่นเกม
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Mission Complete (Premium UI) */}
            {step === 4 && (
                <div className={`bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl p-10 border-[6px] border-white text-center relative transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${showCard ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}>
                    
                    {/* ไอคอนพลุ */}
                    <div className="inline-block mb-4 animate-bounce-slow">
                        <span className="text-9xl filter drop-shadow-md">{streakCount % 7 === 0 ? '🎁' : '🎉'}</span>
                    </div>
                    
                    <h2 className="text-5xl font-black text-[#1e3a8a] mb-2 tracking-tight">
                        ภารกิจสำเร็จ!
                    </h2>
                    
                    <p className="text-xl text-slate-600 font-medium mb-8">
                        คุณทำภารกิจวันนี้เสร็จสมบูรณ์แล้ว
                    </p>

                    {/* Streak Badge */}
                    <div className="flex items-center justify-center gap-2 mb-8 bg-orange-50 py-2 px-6 rounded-full border border-orange-100 inline-flex mx-auto shadow-sm">
                        <span className="text-2xl">🔥</span>
                        <span className="text-slate-600 font-bold">สะสมต่อเนื่อง:</span>
                        <span className="text-2xl font-black text-orange-500">{streakCount} วัน</span>
                    </div>
                    
                    {/* Reward Box */}
                    <div className="bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] border-2 border-[#FDE68A] p-6 rounded-3xl mb-8 shadow-inner relative overflow-hidden group max-w-xs mx-auto">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-45 translate-x-[-100%] animate-shine"></div>
                        <p className="text-[#92400E] font-bold text-lg mb-1 uppercase tracking-wide">
                            {streakCount % 7 === 0 ? 'โบนัสกล่องใหญ่' : 'โบนัสประจำวัน'}
                        </p>
                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#D97706] drop-shadow-sm mt-2">
                             {streakCount % 7 === 0 ? '+500' : '+150'}
                        </div>
                        <div className="text-[#B45309] font-bold text-sm mt-1">คะแนนสะสม</div>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem(STORAGE_KEY);
                            setShowCard(false);
                            setTimeout(() => {
                                setStep(0);
                                router.replace('/games/daily-quiz');
                            }, 300);
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold text-xl shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all border-b-4 border-[#1D4ED8] active:border-b-0 active:translate-y-1"
                    >
                         กลับหน้าภารกิจ ➜
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}