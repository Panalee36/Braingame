'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { useTTS } from '@/hooks/useTTS'

// --- ข้อมูลเกม (คงเดิม) ---
const ALL_GAMES = [
  { id: 'color-matching', title: 'เกมจับคู่สี', icon: '🎨' },
  { id: 'fast-math', title: 'บวกลบเลข', icon: '🔢' },
  { id: 'sequential-memory', title: 'เกมจำลำดับภาพ', icon: '🖼️' },
  { id: 'animal-sound', title: 'เกมฟังเสียงสัตว์', icon: '🐕' },
  { id: 'vocabulary', title: 'เกมจำศัพท์', icon: '📚' },
];

// --- ☁️ ธีมพื้นหลังก้อนเมฆ (คงเดิม) ---
const PerfectCloudTheme = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#7EC8FF]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#CDE8FE]"></div>
      <svg className="absolute top-[8%] left-[5%] w-32 text-white/30 animate-float-slow" viewBox="0 0 120 60" fill="currentColor">
         <path d="M10,40 Q20,15 45,25 Q60,10 80,20 Q100,15 110,35 Q115,50 100,55 H15 Q5,50 10,40 Z" />
      </svg>
      <svg className="absolute top-[12%] right-[5%] w-24 text-white/20 animate-float-delayed" viewBox="0 0 120 60" fill="currentColor">
         <path d="M10,35 Q30,10 55,20 Q80,5 100,25 Q110,45 95,50 H10 Z" />
      </svg>
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

// ฟังก์ชันช่วยคำนวณ Streak
const calculateStreak = (historyList: string[], todayStr: string) => {
  let count = 0;
  const today = new Date(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let checkDate = historyList.includes(todayStr) ? today : yesterday;
  const loopLimit = historyList.length + 30; 
  for (let i = 0; i < loopLimit; i++) {
      if (historyList.includes(checkDate.toDateString())) {
          count++;
          checkDate.setDate(checkDate.getDate() - 1);
      } else { break; }
  }
  return count;
};

// ฟังก์ชันสุ่มเกม
const generateDailyGames = (seed: string) => {
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
  const shuffled = seededShuffle(ALL_GAMES, seed);
  return shuffled.slice(0, 3).map((game) => ({ ...game, level: 1 }));
};

function DailyQuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { speak, cancel } = useTTS();

  const [hasInteracted, setHasInteracted] = useState(() => {
      return !!searchParams.get('action');
  });

  const [soundDisabled, setSoundDisabled] = useState(false);
  const [step, setStep] = useState(0);
  const [games, setGames] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ ดึงค่าตอนโหลดหน้าจอให้ชัวร์ก่อน
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const isSoundOff = localStorage.getItem('daily_quiz_sound_disabled') === 'true';
        setSoundDisabled(isSoundOff);
    }
  }, []);

  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio('/sounds/sound-effects/applause.mp3');
    audio.preload = 'auto';
    successSoundRef.current = audio;
    return () => {
      audio.pause();
      successSoundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isLoaded && step === 4) {
      if (successSoundRef.current) {
        successSoundRef.current.currentTime = 0;
        successSoundRef.current.play().catch(() => console.log('Audio play failed'));
      }
    }
  }, [step, isLoaded]);

  // ✅ Logic การพูด TTS แก้ไขให้เช็ค Storage อย่างรัดกุมที่สุด
  useEffect(() => {
    const isSoundOff = localStorage.getItem('daily_quiz_sound_disabled') === 'true';
    if (!hasInteracted || !isLoaded || soundDisabled || isSoundOff) return;

    let timeoutId: NodeJS.Timeout;

    const playTTS = (text: string) => {
        timeoutId = setTimeout(() => {
            // เช็คชั้นที่ 2: ดักจับตอนที่กำลังจะอ้าปากพูด ว่าโดนสั่งปิดเสียงไปหรือยัง
            if (localStorage.getItem('daily_quiz_sound_disabled') !== 'true') {
                speak(text);
            }
        }, 800);
    };

    if (step === 0) {
        if (!searchParams.get('action')) {
             playTTS("ยินดีต้อนรับสู่ภารกิจประจำวันครับ... ฝึกสมองวันละนิด จิตแจ่มใส... ถ้าพร้อมแล้ว เริ่มทำภารกิจกันเลยครับ");
        }
    } else if (step > 0 && step <= 3) {
        const game = games[step - 1];
        if (game) {
            playTTS(`ด่านที่ ${step}... ${game.title}... ความยากระดับ ${game.level}... กดปุ่มเล่นเกม เพื่อเริ่มได้เลยครับ`);
        }
    } else if (step === 4) {
        playTTS("ยินดีด้วยครับ... คุณทำภารกิจวันนี้สำเร็จแล้ว... สุดยอดมากครับ");
    }

    // Cleanup เวลาย้าย Step ไวๆ หรือกดปุ่ม
    return () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [step, hasInteracted, isLoaded, games, speak, soundDisabled, searchParams]);

  const getStorageKey = (base: string, uid: string | null) => uid ? `${base}_${uid}` : base;

  const saveData = async (newDate: string, newGames: any[], newStep: number, newHistory: string[], newStreak: number, newCycleStart: string, currentUserId: string | null) => {
    const STORAGE_KEY = getStorageKey('daily_quiz_progress_v2', currentUserId);
    const HISTORY_KEY = getStorageKey('daily_quiz_completion_history', currentUserId);
    const CYCLE_KEY = getStorageKey('daily_quiz_cycle_start_date', currentUserId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: newDate, games: newGames, currentStep: newStep }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    localStorage.setItem(CYCLE_KEY, newCycleStart);

    if (currentUserId) {
        try {
            await fetch('/api/game/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    date: newDate,
                    games: newGames,
                    currentStep: newStep,
                    history: newHistory,
                    streak: newStreak,
                    cycleStartDate: newCycleStart
                })
            });
        } catch (err) { console.error("Sync Error", err); }
    }
  };

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toDateString();

        const storedUserId = localStorage.getItem('userId');
        setUserId(storedUserId);
        setCheckingAuth(false);
        if (!storedUserId) return;

        const initialize = async () => {
            let currentGames = [];
            let currentStep = 0;
            let currentHistory: string[] = [];
            let currentCycleStart = todayStr;
            let currentStreak = 0;

            let dbData = null;
            if (storedUserId) {
                try {
                    const res = await fetch(`/api/game/daily?userId=${storedUserId}`);
                    const json = await res.json();
                    if (json.success && json.data) dbData = json.data;
                } catch (e) {}
            }

            const STORAGE_KEY = getStorageKey('daily_quiz_progress_v2', storedUserId);
            const HISTORY_KEY = getStorageKey('daily_quiz_completion_history', storedUserId);
            const CYCLE_KEY = getStorageKey('daily_quiz_cycle_start_date', storedUserId);

            if (dbData && dbData.history) {
                currentHistory = dbData.history;
                if (dbData.cycleStartDate) currentCycleStart = dbData.cycleStartDate;
            } else {
                const localH = localStorage.getItem(HISTORY_KEY);
                if (localH) currentHistory = JSON.parse(localH);
                const localC = localStorage.getItem(CYCLE_KEY);
                if (localC) currentCycleStart = localC;
            }
            if (!currentCycleStart) currentCycleStart = todayStr;
            currentStreak = calculateStreak(currentHistory, todayStr);

            if (dbData && dbData.date === todayStr) {
                currentGames = dbData.games;
                currentStep = dbData.currentStep;
            } else {
                const localData = localStorage.getItem(STORAGE_KEY);
                if (localData) {
                      const parsed = JSON.parse(localData);
                      if (parsed.date === todayStr) {
                           currentGames = parsed.games;
                           currentStep = parsed.currentStep || 0;
                      }
                }
                if (currentGames.length === 0) {
                    currentGames = generateDailyGames(todayStr);
                    currentStep = 0;
                }
            }

            const action = searchParams.get('action');
            const playedStepStr = searchParams.get('playedStep');
            const playedStep = playedStepStr ? parseInt(playedStepStr, 10) : -1;

            let nextStepToShow = currentStep;
            
            if (action === 'next' && playedStep !== -1) {
                currentStep = playedStep; 
            }
            
            const missionViewedKey = `daily_mission_viewed_${storedUserId}_${todayStr}`;
            const hasPressedBack = localStorage.getItem(missionViewedKey) === 'true';

            if (action === 'next' && playedStep === currentStep && currentStep < 4) {
                setHasInteracted(true); 

                const nextStep = currentStep + 1;
                
                if (nextStep === 4) {
                    if (!currentHistory.includes(todayStr)) {
                        currentHistory.push(todayStr);
                        currentStreak = calculateStreak(currentHistory, todayStr);
                        if (storedUserId) {
                            const bonusPoints = (currentStreak % 7 === 0) ? 500 : 150;
                            fetch('/api/game/history', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: storedUserId, gameType: 'daily-quiz-bonus', score: bonusPoints })
                            }).catch(console.error);
                        }
                    }
                    setTimeout(() => runFireworks(), 500);
                    setTimeout(() => setShowCard(true), 100);
                    
                    nextStepToShow = 4;
                } else {
                    nextStepToShow = nextStep;
                }
                
                await saveData(todayStr, currentGames, nextStep, currentHistory, currentStreak, currentCycleStart, storedUserId);
                
            } else if (currentStep === 4) {
                if (hasPressedBack) {
                    nextStepToShow = 0;
                } else {
                    nextStepToShow = 4;
                    setTimeout(() => setShowCard(true), 100);
                }
                await saveData(todayStr, currentGames, 4, currentHistory, currentStreak, currentCycleStart, storedUserId);
            } else {
                await saveData(todayStr, currentGames, currentStep, currentHistory, currentStreak, currentCycleStart, storedUserId);
            }

            setGames(currentGames);
            setStep(nextStepToShow);
            setHistory(currentHistory);
            setStreakCount(currentStreak);
            setCycleStartDate(currentCycleStart);
            setIsLoaded(true);
        };

        initialize();
    }, [searchParams, router, userId]);

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

  const handleStartMission = () => {
        const nextStep = 1;
        setStep(nextStep);
        const todayStr = new Date().toDateString();
        saveData(todayStr, games, nextStep, history, streakCount, cycleStartDate || todayStr, userId);
    };

    const handleOpenGame = () => {
        if (step > 0 && step <= 3) {
            const currentGame = games[step - 1];
            const soundFlag = localStorage.getItem('daily_quiz_sound_disabled');
            const soundParam = soundFlag === 'true' ? 'off' : 'on';
            router.push(`/games/${currentGame.id}?level=${currentGame.level}&mode=daily&dailyStep=${step}&sound=${soundParam}`);
        }
    };

  const renderTimeBasedBar = () => {
    if (!cycleStartDate) return null;

    const anchorDate = new Date(cycleStartDate);
    anchorDate.setHours(0,0,0,0);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let diffTime = today.getTime() - anchorDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0; 
    
    const currentWeek = Math.floor(diffDays / 7);
    
    const windowStartDate = new Date(anchorDate);
    windowStartDate.setDate(windowStartDate.getDate() + (currentWeek * 7));

    const historyTimes = history.map(d => new Date(d).setHours(0,0,0,0));
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
                <div className="absolute top-[1.25rem] left-0 w-full h-1.5 bg-gray-100 -z-0 rounded-full"></div>
                
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const targetDate = new Date(windowStartDate);
                    targetDate.setDate(targetDate.getDate() + offset);
                    targetDate.setHours(0,0,0,0);
                    
                    const targetTime = targetDate.getTime();
                    const todayTime = today.getTime();
                    const isPlayed = historyTimes.includes(targetTime);
                    
                    const dayNumber = (currentWeek * 7) + offset + 1;
                    const dayIndex = targetDate.getDay();
                    const dayName = thaiDays[dayIndex];  

                    let status = 'locked';
                    if (targetTime < todayTime) status = isPlayed ? 'done' : 'missed';
                    else if (targetTime === todayTime) status = isPlayed ? 'done' : 'current';

                    return (
                        <div key={offset} className="flex flex-col items-center relative z-10 w-1/7">
                            <div className={`
                                w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-[3px] text-sm md:text-base font-bold transition-all duration-500 mb-1
                                ${status === 'done' ? 'bg-green-500 border-green-200 text-white shadow-md scale-105' : ''}
                                ${status === 'missed' ? 'bg-rose-500 border-rose-200 text-white shadow-sm' : ''}
                                ${status === 'current' ? 'bg-white border-blue-500 text-blue-600 shadow-xl ring-4 ring-blue-100 scale-110' : ''}
                                ${status === 'locked' ? 'bg-white border-gray-200 text-gray-400' : ''}
                            `}>
                                {status === 'done' && '✓'}
                                {status === 'missed' && dayNumber}
                                {status === 'current' && dayNumber}
                                {status === 'locked' && (offset === 6 ? '🎁' : dayNumber)}
                            </div>

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

    if (userId && step === 0 && !hasInteracted && !searchParams.get('action')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#7EC8FF] p-4 relative overflow-hidden">
                <PerfectCloudTheme />
                <div className="relative z-10 bg-white/95 p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-white backdrop-blur-md">
                    <div className="flex flex-col items-center mb-6">
                        <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner animate-bounce mb-4 text-6xl border-4 border-white">🔊</span>
                        <h1 className="text-4xl font-black text-slate-800 mb-2 drop-shadow-sm">เปิดเสียงเกม</h1>
                    </div>
                    <p className="text-slate-600 mb-8 text-xl font-medium leading-relaxed">
                        เพื่อความสนุกและการฝึกความจำ<br/>กรุณาเปิดเสียงนะครับ
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setHasInteracted(true);
                                setSoundDisabled(false);
                                localStorage.setItem('daily_quiz_sound_disabled', 'false');
                                speak("เสียงพร้อมใช้งานแล้วครับ");
                                setTimeout(() => setStep(0), 0);
                            }}
                            className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl text-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-blue-800"
                        >
                            <span className="text-3xl">✅</span>
                            <span>เริ่มใช้งาน</span>
                        </button>
                        <button
                            onClick={() => {
                                setHasInteracted(true);
                                setSoundDisabled(true);
                                localStorage.setItem('daily_quiz_sound_disabled', 'true');
                                if(cancel) cancel(); // ✅ สั่งยกเลิกเสียง TTS ทันทีที่กดปุ่ม
                            }}
                            className="w-full py-5 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold rounded-2xl text-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-gray-500"
                        >
                            <span className="text-3xl">🚫</span>
                            <span>ไม่ใช้เสียง</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (checkingAuth) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold bg-blue-50">กำลังโหลด...</div>;

    if (!userId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
                <PerfectCloudTheme />
                <div className="relative z-10 bg-white/95 p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md border-4 border-white backdrop-blur-md">
                    <div className="flex flex-col items-center mb-6">
                        <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner mb-4 text-6xl border-4 border-white">🔒</span>
                        <h1 className="text-3xl font-black text-slate-800 mb-2 drop-shadow-sm">สำหรับสมาชิกเท่านั้น</h1>
                    </div>
                    <p className="text-slate-600 mb-8 text-lg font-medium leading-relaxed">
                        กรุณาสมัครสมาชิกหรือเข้าสู่ระบบ<br/>เพื่อเล่นภารกิจประจำวัน
                    </p>
                    <div className="flex flex-col gap-4">
                        <Link href="/register" className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-blue-800">
                            <span className="text-2xl">📝</span>
                            <span>สมัครสมาชิก</span>
                        </Link>
                        <Link href="/login" className="w-full py-4 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold rounded-2xl text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-gray-500">
                            <span className="text-2xl">🔑</span>
                            <span>เข้าสู่ระบบ</span>
                        </Link>
                            <button
                                type="button"
                                onClick={() => router.push("/welcome")}
                                className="w-full py-4 bg-gradient-to-r from-red-200 to-red-400 hover:from-red-300 hover:to-red-500 text-red-800 font-bold rounded-2xl text-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-b-4 border-red-500"
                            >
                                <span className="text-2xl">❌</span>
                                <span>ยกเลิก</span>
                            </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold bg-blue-50">กำลังโหลด...</div>;

    return (
        <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <PerfectCloudTheme />

                <div className="flex justify-end w-full max-w-3xl mt-4 mb-2">
                    <span className="uppercase text-base font-bold text-blue-800 bg-white/80 px-6 py-2 rounded-full shadow border border-blue-100 tracking-widest select-none">ระดับง่าย</span>
                </div>

                <div className="w-full max-w-3xl relative z-10">
            
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
                                            {game.level === 1 ? 'ระดับง่าย' : 'ระดับยาก'}
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
                                                <Link
                                                    href="/welcome"
                                                    className="w-full inline-block py-4 bg-white text-blue-500 font-bold text-xl rounded-2xl shadow-lg border-4 border-blue-200 hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-95 mt-2"
                                                >
                                                    หน้าเลือกเกม
                                                </Link>
                                        </div>
                </div>
            )}

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
                        <p className="text-slate-500 mb-10 font-medium">ความยาก{games[step-1].level === 1 ? 'ระดับง่าย' : 'ระดับยาก'}</p>

                        <button
                            onClick={handleOpenGame}
                            className="w-full max-w-sm py-5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-2xl font-bold rounded-2xl shadow-xl border-b-[6px] border-[#1D4ED8] active:border-b-0 active:translate-y-1.5 transition-all"
                        >
                            ▶️ เล่นเกม
                        </button>
                    </div>
                </div>
            )}

                {step === 4 && (
                <div className={`bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl p-10 border-[6px] border-white text-center relative transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${showCard ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}>
                    
                    <div className="inline-block mb-4 animate-bounce-slow">
                        <span className="text-9xl filter drop-shadow-md">{streakCount % 7 === 0 ? '🎁' : '🎉'}</span>
                    </div>
                    
                    <h2 className="text-5xl font-black text-[#1e3a8a] mb-2 tracking-tight">
                        ภารกิจสำเร็จ!
                    </h2>
                    
                    <p className="text-xl text-slate-600 font-medium mb-8">
                        คุณทำภารกิจวันนี้เสร็จสมบูรณ์แล้ว
                    </p>

                    <div className="flex items-center justify-center gap-2 mb-8 bg-orange-50 py-2 px-6 rounded-full border border-orange-100 mx-auto shadow-sm">
                        <span className="text-2xl">🔥</span>
                        <span className="text-slate-600 font-bold">สะสมต่อเนื่อง:</span>
                        <span className="text-2xl font-black text-orange-500">{streakCount} วัน</span>
                    </div>
                    
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
                            const todayStr = new Date().toDateString();
                            localStorage.setItem(`daily_mission_viewed_${userId}_${todayStr}`, 'true');
                            
                            setShowCard(false);
                            setStep(0);
                            router.push('/games/daily-quiz');
                        }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold text-xl shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all border-b-4 border-[#1D4ED8] active:border-b-0 active:translate-y-1"
                    >
                        กลับหน้าภารกิจ 
                    </button>

                </div>
            )}

        </div>

    </div>
  );
}

export default function DailyQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>}>
      <DailyQuizPageContent />
    </Suspense>
  )
}
