'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTTS } from '@/hooks/useTTS'

// ... (ส่วน ExactCartoonTheme และ Interface คงเดิม ไม่ต้องแก้) ...
const ExactCartoonTheme = () => (
  <div
    className="absolute inset-0 z-0 overflow-hidden"
    style={{
      background: 'linear-gradient(180deg, #ffe7ba 0%, #fff7e0 30%, #fbc2eb 100%)'
    }}
  >
    {/* Pink Bubbles */}
    <svg className="absolute top-[8%] left-[8%] w-32 h-32 opacity-40 animate-float-slow" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="40" fill="#ffe7ba" />
    </svg>
    <svg className="absolute top-[20%] right-[10%] w-24 h-24 opacity-30 animate-float-delayed" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="35" fill="#fbc2eb" />
    </svg>
    <svg className="absolute bottom-[18%] left-[18%] w-20 h-20 opacity-30 animate-float" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="30" fill="#fff7e0" />
    </svg>
    <svg className="absolute bottom-[10%] right-[15%] w-28 h-28 opacity-40 animate-float-slow" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill="#ffe7ba" />
    </svg>
    {/* Soft white/pink cloud waves at bottom */}
    <div className="absolute bottom-0 w-full h-auto">
      <svg className="absolute bottom-0 w-full h-[280px] md:h-[400px] text-pink-100/60 transform scale-110 origin-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,192 C150,120 300,150 400,180 C550,220 650,120 800,140 C950,160 1050,220 1200,200 C1350,180 1400,100 1440,120 V320 H0 Z" />
      </svg>
      <svg className="relative w-full h-[220px] md:h-[320px] text-pink-200 drop-shadow-md" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,256 C120,200 240,160 360,192 C480,224 550,280 680,260 C800,240 880,160 1000,170 C1150,180 1250,240 1360,220 C1400,210 1420,200 1440,220 V320 H0 Z" />
      </svg>
    </div>
  </div>
);

interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+' | '-'
  correctAnswer: number
  options: number[]
  nums?: number[]
}

function FastMathGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');

  const { speak, cancel } = useTTS();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [soundDisabled, setSoundDisabled] = useState(false);
  // ✅ อ่านค่า soundDisabled จาก localStorage ถ้าเป็น daily mode
  useEffect(() => {
    if (isDailyMode) {
      setHasInteracted(true);
      // ลำดับความสำคัญ: query string > localStorage > เปิดเสียง
      const local = localStorage.getItem('daily_quiz_sound_disabled');
      if (local === 'true') {
        setSoundDisabled(true);
        cancel();
      } else {
        setSoundDisabled(false);
      }
    }
  }, [isDailyMode, cancel]);
  const hasSpokenWelcome = useRef(false);

  // ไม่ต้องใช้ isSaving ใน State แล้ว เพราะเราจะเช็คตอนจบเกมทีเดียว
  // const [isSaving, setIsSaving] = useState(false); 

  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(levelFromQuery)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  
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
  const applauseSoundRef = useRef<HTMLAudioElement | null>(null)

  // ... (useEffect เสียงปรบมือ คงเดิม) ...
  useEffect(() => {
    const applause = new Audio()
    applause.src = '/sounds/Soundeffect/Applause.mp3'
    applause.preload = 'auto'
    applause.volume = 1.0
    applause.addEventListener('canplaythrough', () => console.log('🎵 เสียงปรบมือโหลดสำเร็จ'))
    applause.addEventListener('error', (e) => console.error('❌ เสียงปรบมือโหลดข้อผิดพลาด:', e))
    applauseSoundRef.current = applause
    return () => { if (applauseSoundRef.current) applauseSoundRef.current.pause() }
  }, [])

  // ... (useEffect ระบบเสียง 3 ตัว คงเดิม) ...
  useEffect(() => {
    if (hasInteracted && !hasSpokenWelcome.current && !gameStarted && !isDailyMode && !showDemo && !soundDisabled) {
       setTimeout(() => {
         speak("ยินดีต้อนรับสู่เกมบวกลบเลขครับ... กติกาคือ ให้เลือกคำตอบที่ถูกต้องให้ไวที่สุดครับ... เลือกระดับความยากเพื่อเริ่มเล่นได้เลย");
         hasSpokenWelcome.current = true;
       }, 1000);
    }
  }, [hasInteracted, gameStarted, isDailyMode, showDemo, speak, soundDisabled]);

  useEffect(() => {
    if (gameStarted && !gameCompleted && currentQuestion && !answered && !soundDisabled) {
      const timer = setTimeout(() => {
        let text = "";
        if (difficulty === 1) {
          const op = currentQuestion.operation === '+' ? 'บวก' : 'ลบ';
          text = `${currentQuestion.num1} ${op} ${currentQuestion.num2} เท่ากับเท่าไหร่ครับ`;
        } else if (currentQuestion.nums) {
          text = currentQuestion.nums.join(' บวก ') + ' เท่ากับเท่าไหร่ครับ';
        }
        speak(text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, gameStarted, gameCompleted, answered, difficulty, speak, soundDisabled]);

  useEffect(() => {
    if (gameCompleted) {
      const timer = setTimeout(() => {
        if (applauseSoundRef.current) {
          applauseSoundRef.current.currentTime = 0
          applauseSoundRef.current.play().catch((error) => console.error('❌', error))
        }
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [gameCompleted])

  // ... (customGenerateMathQuestion คงเดิม) ...
  const customGenerateMathQuestion = (level: number): MathQuestion => {
    if (level === 1) {
      const min = 0, max = 9;
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

  const initializeGame = React.useCallback((levelOverride?: number) => {
    cancel(); 
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
  }, [difficulty]);

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        initializeGame(levelFromQuery);
    }
  }, [isDailyMode, gameStarted, gameCompleted, initializeGame, levelFromQuery]);

  // ... (startDemo และ closeDemo คงเดิม) ...
  const startDemo = () => {
    cancel(); 
    setShowDemo(true)
    setDemoStep(0)
    const demoQuestion: MathQuestion = {
      id: 'demo',
      num1: 15,
      num2: 7,
      operation: '+',
      correctAnswer: 22,
      options: [22, 20, 25, 18]
    }
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
      if (!soundDisabled) speak("ตัวอย่างการเล่น... โจทย์คือ 15 บวก 7 เท่ากับเท่าไหร่ครับ")
      
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2)
        if (!soundDisabled) speak("มองหาคำตอบที่ถูกต้องในตัวเลือก... 15 บวก 7 เท่ากับ 22 ครับ")
        
        demoTimeoutRef.current = setTimeout(() => {
          setSelectedAnswer(22)
          setDemoStep(3)
          if (!soundDisabled) speak("ถูกต้อง... เมื่อตอบถูก จะได้รับคะแนน")
          
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4)
            if (!soundDisabled) speak("เล่นไปเรื่อยๆ จนครบ 10 ข้อ... เข้าใจแล้วใช่ไหมครับ... กดเริ่มเล่นได้เลย")
          }, 5000)
        }, 5000)
      }, 5000)
    }, 2000)
  }

  const closeDemo = () => {
    cancel();
    setShowDemo(false);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
  }

  const loadNextQuestion = () => {
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
    const newQuestion = customGenerateMathQuestion(difficulty);
    setCurrentQuestion(newQuestion);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  // ✅ ฟังก์ชันช่วยบันทึกคะแนน (แยกออกมาเพื่อความชัวร์) - ไม่บันทึกถ้าเป็น daily mode
  const saveScoreToDB = (finalScore: number) => {
    if (isDailyMode) {
      console.log("ℹ️ โหมด Daily Quiz - ไม่บันทึกประวัติการเล่น");
      return;
    }
    const userId = localStorage.getItem('userId');
    if (userId) {
      console.log("💾 กำลังบันทึกคะแนน...", finalScore);
      fetch('/api/game/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          gameType: 'fast-math',
          score: finalScore
        })
      })
      .then(res => res.json())
      .then(data => console.log('✅ Score saved successfully:', data))
      .catch(err => console.error('❌ Error saving score:', err));
    } else {
        console.warn("⚠️ ไม่พบ User ID ในเครื่อง (อาจจะยังไม่ได้ Login หรือเล่นแบบ Guest)");
    }
  };

  const MAX_QUESTIONS = 10;

  // ✅ แก้ไขฟังก์ชัน handleAnswer ให้คำนวณคะแนนและบันทึกทันทีที่จบเกม
  const handleAnswer = (answer: number) => {
    if (answered) return
    setSelectedAnswer(answer)
    setAnswered(true)
    
    // 1. คำนวณคะแนนใหม่ทันที (ไม่รอ State)
    let newScore = score;
    let newCorrectAnswers = correctAnswers;

    if (answer === currentQuestion?.correctAnswer) {
      newScore = score + 1;
      newCorrectAnswers = correctAnswers + 1;
      setScore(newScore); // อัปเดต State เพื่อแสดงผล
      setCorrectAnswers(newCorrectAnswers);
    }

    setQuestionsAnswered((q) => q + 1)

    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
    answerTimeoutRef.current = setTimeout(() => {
      answerTimeoutRef.current = null
      if (gameCompletedRef.current) return
      
      // 2. เช็คว่าจบเกมหรือยัง
      if (questionsAnswered + 1 >= MAX_QUESTIONS) {
        gameCompletedRef.current = true
        setGameCompleted(true)
        
        // 3. ✅ บันทึกคะแนนที่คำนวณเสร็จแล้วทันที! (ไม่ต้องรอ useEffect)
        saveScoreToDB(newScore); 
      } else {
        loadNextQuestion()
      }
    }, 1500)
  }

  // ... (ส่วน useEffect ของ Timer คงเดิม) ...
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

  const successRate = questionsAnswered > 0 ? ((correctAnswers / questionsAnswered) * 100).toFixed(1) : '0';
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const nextDifficulty = (level: number) => (level === 1 ? 2 : 1);
  const nextDifficultyLabel = (level: number) => (level === 1 ? 'ยาก' : 'ง่าย');

  // ... (ส่วน UI ทั้งหมดคงเดิม 100% ตั้งแต่บรรทัดนี้ลงไป) ...
  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffe7ba] p-4 relative overflow-hidden">
        <ExactCartoonTheme />
        <div className="relative z-10 bg-white/95 p-10 rounded-[2rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-white">
          <div className="text-7xl mb-4 animate-bounce">🗣️</div>
          <h1 className="text-3xl font-black text-[#1e40af] mb-4">เปิดเสียงบรรยาย</h1>
          <p className="text-slate-600 mb-8 text-lg font-medium">
              เพื่อให้การเล่นสมบูรณ์ กรุณากดปุ่มด้านล่างเพื่อเปิดเสียงครับ
          </p>
          <div className="flex flex-col gap-4 mb-2">
            <button 
              onClick={() => {
                setHasInteracted(true);
                setSoundDisabled(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              🔊 เริ่มใช้งาน
            </button>
            <button
              onClick={() => {
                setHasInteracted(true);
                setSoundDisabled(true);
                cancel();
              }}
              className="w-full py-4 flex items-center justify-center gap-2 bg-gray-300 text-gray-700 font-bold rounded-2xl text-xl shadow border-b-4 border-gray-400 transition-all"
              style={{ outline: 'none' }}
            >
              <span className="text-2xl">🚫</span>
              <span>ไม่ใช้เสียง</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDailyMode && !gameStarted && !gameCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse relative overflow-hidden">
        <ExactCartoonTheme />
        <span className="relative z-10 bg-white/80 px-8 py-4 rounded-full shadow-lg">กำลังโหลดโจทย์...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col items-center relative overflow-hidden p-4 md:p-6">
      <ExactCartoonTheme />
      <div className="relative z-10 w-full flex flex-col items-center flex-1">
        {gameStarted && !gameCompleted && !showDemo && (
          <div className="w-full max-w-5xl bg-gradient-to-r from-[#f8fbff] to-[#eef3ff] rounded-[2.5rem] shadow-xl px-10 py-5 mb-7 flex items-center justify-between sticky top-4 z-50 border border-[#e0e7ef] min-h-[80px]">
            {!isDailyMode ? (
              <button
                onClick={() => {
                  cancel();
                  setGameStarted(false);
                  setGameCompleted(false);
                  setScore(0);
                  setCurrentQuestion(null);
                  setSelectedLevel(null);
                }}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-[#e9d5ff] text-purple-700 font-bold text-xl shadow hover:bg-[#d8b4fe] transition-all"
              >
                <span className="text-lg">✕</span> เลิกเล่น
              </button>
            ) : (
              <div className="px-6 py-3 bg-yellow-50 text-yellow-800 rounded-2xl font-bold flex items-center gap-2 shadow border border-yellow-100"><span>📅</span> ภารกิจประจำวัน</div>
            )}
            <div className="flex flex-col items-end flex-1 ml-4">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">LEVEL</span>
              <span className="text-3xl font-black text-blue-700 drop-shadow-sm">{difficulty === 1 ? 'ระดับง่าย' : 'ระดับยาก'}</span>
            </div>
          </div>
        )}

        {gameStarted && !gameCompleted && !showDemo && (
          <div className="flex flex-col items-center w-full max-w-2xl mb-6 animate-fade-in relative z-10">
            <div className="grid grid-cols-2 gap-4 md:gap-8 w-full mb-4">
              <div className="bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] p-4 rounded-xl shadow-md flex flex-col items-center justify-center border-2 border-blue-200 min-w-[110px]">
                <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">เวลา</p>
                <p className="text-2xl font-black text-blue-600 tabular-nums drop-shadow">{formatTime(totalTime)}</p>
              </div>
              <div className="bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] p-4 rounded-xl shadow-md flex flex-col items-center justify-center border-2 border-blue-200 min-w-[110px]">
                <p className="text-green-400 font-bold text-xs uppercase tracking-wider mb-1">ข้อที่</p>
                <p className="text-2xl font-black text-green-600 tabular-nums drop-shadow">{questionsAnswered}<span className="text-2xl font-black text-green-600 tabular-nums opacity-70"> / {MAX_QUESTIONS}</span></p>
              </div>
            </div>
            <button 
              onClick={() => {
                  let text = "";
                  if (difficulty === 1) {
                      const op = currentQuestion?.operation === '+' ? 'บวก' : 'ลบ';
                      text = `${currentQuestion?.num1} ${op} ${currentQuestion?.num2} เท่ากับเท่าไหร่ครับ`;
                  } else if (currentQuestion?.nums) {
                      text = currentQuestion.nums.join(' บวก ') + ' เท่ากับเท่าไหร่ครับ';
                  }
                  speak(text);
              }}
              className="px-6 py-3 bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] rounded-xl hover:scale-105 transition-all text-3xl shadow-md hover:shadow-xl border-2 border-blue-200"
              title="ฟังโจทย์ซ้ำ"
            >
              🔊
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center w-full my-auto animate-fade-in z-20">
          {showDemo ? (
            <div className="w-full max-w-4xl">
              <div className="bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 md:p-12 border-8 border-white/50 ring-4 ring-yellow-200 relative overflow-hidden animate-fade-in">
                
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 animate-bounce-slow">
                    <span className="text-6xl">💡</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-2">ตัวอย่างการเล่น</h2>
                  <p className="text-lg text-slate-600 font-medium">มาดูวิธีเล่นกันเลย!</p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`w-12 h-2 rounded-full transition-all duration-500 ${demoStep >= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  ))}
                </div>

                <div className="mb-8">
                  {demoStep === 0 && (
                    <div className="text-center p-6 bg-blue-50 rounded-2xl animate-fade-in">
                      <p className="text-2xl font-bold text-blue-800">กำลังเริ่มต้น...</p>
                    </div>
                  )}
                  
                  {demoStep === 1 && currentQuestion && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                        <p className="text-xl font-bold text-blue-900 mb-2">📋 ขั้นตอนที่ 1: อ่านโจทย์</p>
                        <p className="text-lg text-slate-700">ดูโจทย์คณิตศาสตร์ที่ปรากฏ</p>
                      </div>
                      <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-blue-100 transform scale-105 animate-pulse-subtle">
                        <div className="text-7xl font-black text-blue-700 text-center bg-blue-50 rounded-2xl py-8">
                          15 + 7 = ?
                        </div>
                      </div>
                    </div>
                  )}

                  {demoStep === 2 && currentQuestion && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                        <p className="text-xl font-bold text-green-900 mb-2">🤔 ขั้นตอนที่ 2: คิดและหาคำตอบ</p>
                        <p className="text-lg text-slate-700">15 + 7 = 22</p>
                      </div>
                      <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-blue-100 mb-6">
                        <div className="text-6xl font-black text-blue-700 text-center bg-blue-50 rounded-2xl py-8">
                          15 + 7 = ?
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`py-8 px-6 text-4xl font-bold rounded-2xl transition-all bg-gradient-to-b from-slate-50 to-slate-100 border-4 border-slate-200 ${option === 22 ? 'ring-4 ring-green-400 animate-pulse' : 'opacity-50'}`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-4">
                        <p className="text-lg text-green-600 font-bold animate-bounce">👆 มองหาคำตอบที่ถูกต้อง</p>
                      </div>
                    </div>
                  )}

                  {demoStep === 3 && currentQuestion && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200">
                        <p className="text-xl font-bold text-yellow-900 mb-2">👆 ขั้นตอนที่ 3: เลือกคำตอบ</p>
                        <p className="text-lg text-slate-700">คลิกที่คำตอบที่ถูกต้อง</p>
                      </div>
                      <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-blue-100 mb-6">
                        <div className="text-6xl font-black text-blue-700 text-center bg-blue-50 rounded-2xl py-8">
                          15 + 7 = ?
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`py-8 px-6 text-4xl font-bold rounded-2xl transition-all transform ${
                              option === 22 
                                ? 'bg-gradient-to-b from-green-400 to-green-500 text-white border-4 border-green-600 scale-110 shadow-2xl animate-bounce-once' 
                                : 'bg-gradient-to-b from-slate-50 to-slate-100 border-4 border-slate-200 opacity-30'
                            }`}
                          >
                            {option === 22 ? (
                              <div className="flex items-center justify-center gap-3">
                                <span>✓</span>
                                <span>{option}</span>
                              </div>
                            ) : option}
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-6 p-4 bg-green-100 rounded-2xl">
                        <p className="text-2xl font-black text-green-700">🎉 ถูกต้อง! +10 คะแนน</p>
                      </div>
                    </div>
                  )}

                  {demoStep === 4 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                        <p className="text-xl font-bold text-purple-900 mb-2">🎯 ขั้นตอนที่ 4: เล่นต่อ</p>
                        <p className="text-lg text-slate-700">ทำแบบนี้ไปเรื่อยๆ จนครบ 10 ข้อ!</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border-4 border-blue-200">
                        <div className="text-center space-y-4">
                          <p className="text-3xl font-black text-blue-900">กติกาเกม</p>
                          <div className="space-y-3 text-left max-w-md mx-auto">
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                              <span className="text-2xl">📝</span>
                              <p className="text-lg text-slate-700">ตอบโจทย์คณิตศาสตร์ให้ถูกต้อง</p>
                            </div>
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                              <span className="text-2xl">⚡</span>
                              <p className="text-lg text-slate-700">ตอบให้เร็วที่สุดเท่าที่จะทำได้</p>
                            </div>
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                              <span className="text-2xl">🎯</span>
                              <p className="text-lg text-slate-700">ทำครบ 10 ข้อเพื่อจบเกม</p>
                            </div>
                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                              <span className="text-2xl">⭐</span>
                              <p className="text-lg text-slate-700">ตอบถูก 1 ข้อ = 10 คะแนน</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-8">
                  <button 
                    onClick={closeDemo} 
                    className="flex-1 py-5 bg-gradient-to-r from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-800 font-bold text-xl rounded-2xl shadow-lg transition-all hover:scale-105 border-b-4 border-slate-400"
                  >
                    ❌ ปิดตัวอย่าง
                  </button>
                </div>
              </div>
            </div>
          ) : !gameStarted ? (
            <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in my-auto pb-40">
              <div className="text-center mb-6">
                <div className="inline-block p-6 bg-[#FFD180] rounded-[2.5rem] shadow-lg mb-4">
                  <span className="text-8xl filter drop-shadow-sm">🔢</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-[#1e40af] mb-3 tracking-tight drop-shadow-sm">บวกลบเลข</h1>
                <p className="text-xl text-slate-700 font-bold mb-1">ฝึกคิดเลขเร็ว</p>
                <p className="text-base text-slate-500 font-medium">เลือกคำตอบที่ถูกต้องให้ไวที่สุด</p>
                <div className="flex flex-row justify-center mt-6 gap-4 items-center w-full">
                    <button
                      onClick={() => speak('เลือกความยาก เพื่อเริ่มเล่นได้เลยครับ')}
                      className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                      type="button"
                    >
                      <span className="text-xl">🔊</span>
                      <span>ฟังคำแนะนำ</span>
                    </button>
                    <button
                      onClick={startDemo}
                      className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-yellow-400"
                      type="button"
                    >
                      <span className="text-xl">💡</span>
                      <span>ตัวอย่างการเล่น</span>
                    </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl justify-center items-stretch mb-8 px-4">
                <button 
                  onClick={() => {
                    setSelectedLevel(1);
                    if (!soundDisabled) speak("ระดับง่ายครับ");
                  }}
                  className={`flex-1 group relative bg-white rounded-[2rem] p-6 transition-all duration-300 flex flex-col items-center justify-center ${
                    selectedLevel === 1 
                      ? 'shadow-[0_4px_20px_rgba(59,130,246,0.5)] scale-[1.02] border-4 border-blue-400' 
                      : 'shadow-lg border-4 border-transparent hover:border-blue-200 hover:shadow-xl'
                  }`}
                >
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-3 shadow-sm">😊</div>
                  <h3 className={`text-2xl font-black mb-1 ${selectedLevel === 1 ? 'text-[#2563EB]' : 'text-[#1e3a8a]'}`}>ระดับง่าย</h3>
                  <p className="text-xs text-slate-500 font-semibold">บวกลบเลขหลักหน่วย ตั้งแต่ 0-9</p>
                </button>
                <button 
                  onClick={() => {
                    setSelectedLevel(2);
                    if (!soundDisabled) speak("ระดับยากครับ");
                  }}
                  className={`flex-1 group relative bg-white rounded-[2rem] p-6 transition-all duration-300 flex flex-col items-center justify-center ${
                    selectedLevel === 2 
                      ? 'shadow-[0_4px_20px_rgba(168,85,247,0.5)] scale-[1.02] border-4 border-purple-400' 
                      : 'shadow-lg border-4 border-transparent hover:border-purple-200 hover:shadow-xl'
                  }`}
                >
                  <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-5xl mb-3 shadow-sm">🤓</div>
                  <h3 className={`text-2xl font-black mb-1 ${selectedLevel === 2 ? 'text-[#7C3AED]' : 'text-[#581c87]'}`}>ระดับยาก</h3>
                  <p className="text-xs text-slate-500 font-semibold">โจทย์เลข 3-4 ตัว</p>
                </button>
              </div>
              <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4">
                <button
                  onClick={() => { 
                    if (selectedLevel) {
                      if (!soundDisabled) speak("เริ่มเกมครับ");
                      initializeGame(selectedLevel);
                    }
                  }}
                  disabled={!selectedLevel}
                  className={`w-full py-3.5 rounded-[2rem] text-xl font-black shadow-md transition-all duration-200 ${
                    selectedLevel 
                      ? 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white hover:scale-105 hover:shadow-lg cursor-pointer' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  เริ่มเล่น
                </button>
                <button
                  onClick={() => {
                    cancel();
                    router.push('/welcome');
                  }}
                  className="w-full py-3.5 rounded-[2rem] bg-[#3B82F6] text-white font-black text-xl hover:bg-[#2563EB] transition-all shadow-md"
                >
                  หน้าเลือกเกม
                </button>
              </div>
            </div>
          ) : gameCompleted ? (
            <div className="w-full max-w-3xl">
              <div className="card text-center bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-16 border-[8px] border-white/50 ring-4 ring-blue-200">
                <div className="mb-6 drop-shadow-md" style={{fontSize: '8rem'}}>🎉</div>
                <h2 className="text-8xl font-black text-blue-900 mb-6 tracking-tight">เก่งมาก!</h2>
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="bg-blue-50 p-10 rounded-3xl border-2 border-blue-100">
                    <p className="text-blue-600 font-bold text-2xl mb-2 uppercase tracking-wider">คะแนนรวม</p>
                    <p className="text-7xl font-black text-blue-800">{score}/10</p>
                  </div>
                  <div className="bg-green-50 p-10 rounded-3xl border-2 border-green-100">
                    <p className="text-green-600 font-bold text-2xl mb-2 uppercase tracking-wider">ใช้เวลา</p>
                    <p className="text-7xl font-black text-green-800">{formatTime(totalTime)}</p>
                  </div>
                </div>

                {isDailyMode ? (
                  <button 
                    onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                    className="w-full py-7 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl font-bold rounded-2xl shadow-xl shadow-green-200 transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    ✅ ผ่านด่าน (ไปต่อ)
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    {difficulty === 1 && (
                      <button
                        onClick={() => {
                          setDifficulty(2);
                          setGameStarted(true);
                          setGameCompleted(false);
                          setSelectedLevel(null);
                          setScore(0);
                          setTotalTime(0);
                          setQuestionsAnswered(0);
                          setCorrectAnswers(0);
                          setCurrentQuestion(null);
                          setAnswered(false);
                          setSelectedAnswer(null);
                          // สร้างโจทย์ใหม่ระดับยากทันที
                          const newQuestion = customGenerateMathQuestion(2);
                          setCurrentQuestion(newQuestion);
                        }}
                        className="w-full max-w-md mx-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-500 text-white text-3xl font-bold py-6 px-10 rounded-2xl shadow-lg border-2 border-green-600 transition-all drop-shadow-lg"
                        style={{
                          textShadow: '0 2px 8px rgba(22, 163, 74, 0.18)',
                          boxShadow: '0 8px 24px 0 rgba(22, 163, 74, 0.18), 0 2px 8px 0 rgba(22, 163, 74, 0.10)'
                        }}
                      >
                        ถัดไป (ยาก)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setGameStarted(false);
                        setGameCompleted(false);
                        setSelectedLevel(null);
                        setScore(0);
                        setTotalTime(0);
                        setQuestionsAnswered(0);
                        setCorrectAnswers(0);
                        setCurrentQuestion(null);
                      }}
                      className="w-full max-w-md mx-auto mt-4 bg-gradient-to-r from-[#38bdf8] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#1d4ed8] active:from-[#2563eb] active:to-[#38bdf8] text-white text-3xl font-bold py-6 px-10 rounded-2xl shadow-lg border-2 border-[#2563eb] transition-all drop-shadow-lg"
                      style={{
                        textShadow: '0 2px 8px rgba(37, 99, 235, 0.18)',
                        boxShadow: '0 8px 24px 0 rgba(37, 99, 235, 0.18), 0 2px 8px 0 rgba(37, 99, 235, 0.10)'
                      }}
                    >
                      กลับหน้าแรก
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="w-full max-w-3xl">

              <div className="card text-center mb-8 bg-white/90 rounded-3xl shadow-xl p-8">
                <div className="text-6xl font-bold text-blue-700 mb-8 p-8 bg-blue-100 rounded-2xl">
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
      </div>
    </div>
  );
}

export default function FastMathGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>}>
      <FastMathGameContent />
    </Suspense>
  )
}