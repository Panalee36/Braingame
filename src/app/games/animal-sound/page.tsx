'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
// import { generateAnimalSounds } from '@/utils/gameUtils' (ลบออก ใช้ animalUtils แทน)
import { generateAnimalSounds, ANIMALS } from '@/utils/gameUtils'
import { useTTS } from '@/hooks/useTTS'

// Cartoon green nature background theme
const ExactCartoonTheme = () => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-[#d0f5e8]">
    <div className="absolute inset-0 bg-gradient-to-b from-[#e6ffe6] via-[#b7eacb] via-70% to-[#e0f7fa]" />
    <svg className="absolute top-[8%] left-[7%] w-44 h-20 text-white/40 animate-float-slow" viewBox="0 0 200 120" fill="currentColor">
      <ellipse cx="60" cy="60" rx="60" ry="30" />
      <ellipse cx="120" cy="50" rx="40" ry="20" />
    </svg>
    <svg className="absolute top-[12%] right-[10%] w-36 h-16 text-white/30 animate-float-delayed" viewBox="0 0 200 120" fill="currentColor">
      <ellipse cx="80" cy="60" rx="60" ry="25" />
      <ellipse cx="140" cy="50" rx="30" ry="15" />
    </svg>
    <svg className="absolute left-[12%] top-[30%] w-16 h-16 animate-leaf-float-slow" viewBox="0 0 64 64" fill="none">
      <path d="M32 60C44 44 60 32 60 32C60 32 44 20 32 4C20 20 4 32 4 32C4 32 20 44 32 60Z" fill="#7ed957" stroke="#4caf50" strokeWidth="2"/>
      <ellipse cx="32" cy="32" rx="8" ry="20" fill="#b2f2a5" fillOpacity=".5"/>
    </svg>
    <svg className="absolute right-[18%] top-[22%] w-12 h-12 animate-leaf-float" viewBox="0 0 64 64" fill="none">
      <path d="M32 60C44 44 60 32 60 32C60 32 44 20 32 4C20 20 4 32 4 32C4 32 20 44 32 60Z" fill="#a3e635" stroke="#65a30d" strokeWidth="2"/>
      <ellipse cx="32" cy="32" rx="7" ry="16" fill="#d9f99d" fillOpacity=".5"/>
    </svg>
    <svg className="absolute left-[25%] top-[55%] w-10 h-10 animate-leaf-float-delayed" viewBox="0 0 64 64" fill="none">
      <path d="M32 60C44 44 60 32 60 32C60 32 44 20 32 4C20 20 4 32 4 32C4 32 20 44 32 60Z" fill="#bef264" stroke="#65a30d" strokeWidth="2"/>
      <ellipse cx="32" cy="32" rx="6" ry="13" fill="#f7fee7" fillOpacity=".5"/>
    </svg>
    <svg className="absolute left-[20%] top-[18%] w-10 h-10 animate-bubble-float" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#fff" fillOpacity=".18" />
      <circle cx="26" cy="14" r="5" fill="#fff" fillOpacity=".12" />
    </svg>
    <svg className="absolute right-[22%] top-[40%] w-8 h-8 animate-bubble-float-delayed" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#fff" fillOpacity=".13" />
    </svg>
    <svg className="absolute left-[40%] top-[10%] w-7 h-7 animate-bubble-float" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#fff" fillOpacity=".10" />
    </svg>
    <div className="absolute bottom-0 w-full h-auto">
      <svg className="absolute bottom-0 w-full h-[220px] md:h-[320px] text-[#b2e59e]" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,256 C120,200 240,160 360,192 C480,224 550,280 680,260 C800,240 880,160 1000,170 C1150,180 1250,240 1360,220 C1400,210 1420,200 1440,220 V320 H0 Z" />
      </svg>
      <svg className="relative w-full h-[120px] md:h-[180px] text-[#d6f5c7] drop-shadow-md" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,192 C150,120 300,150 400,180 C550,220 650,120 800,140 C950,160 1050,220 1200,200 C1350,180 1400,100 1440,120 V320 H0 Z" />
      </svg>
    </div>
  </div>
);

interface AnimalSound {
  id: string;
  name: string;
  soundUrl: string;
  imageUrl: string;
}

function AnimalSoundGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const dailyStep = searchParams.get('dailyStep');

  // ✅ เรียกใช้ Hook เสียง
  const { speak, cancel } = useTTS();
  const [hasInteracted, setHasInteracted] = useState(false);
  // ✅ แทรกโค้ดนี้ลงไปบรรทัดถัดมาได้เลยครับ
  useEffect(() => {
    if (isDailyMode) {
        setHasInteracted(true);
    }
  }, [isDailyMode]);

  const [soundDisabled, setSoundDisabled] = useState(false);
  const hasSpokenWelcome = useRef(false);

  // Daily-quiz: force hasInteracted true, and sync soundDisabled from query param
  useEffect(() => {
    if (isDailyMode) {
      setHasInteracted(true);
      // If sound param is present, sync soundDisabled
      const soundParam = searchParams.get('sound');
      if (soundParam === 'off') {
        setSoundDisabled(true);
      } else if (soundParam === 'on') {
        setSoundDisabled(false);
      }
    }
  }, [isDailyMode, searchParams]);

  // ✅ เพิ่ม State สำหรับกันการบันทึกซ้ำ
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ เพิ่ม State สำหรับติดตามว่าได้อธิบายแค่ข้อแรกหรือยัง
  const [hasGivenInstructions, setHasGivenInstructions] = useState(false);

  const [currentAnimal, setCurrentAnimal] = useState<AnimalSound | null>(null)
  const [options, setOptions] = useState<AnimalSound[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  // เก็บ index ของสัตว์ที่ใช้ไปแล้วในรอบนี้
  const [usedAnimalIndexes, setUsedAnimalIndexes] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  // -----------------------------------------------------------------
  // 🔊 ระบบนักพากย์ (Narrator Logic)
  // -----------------------------------------------------------------

  // 3.1 เสียงต้อนรับ
  useEffect(() => {
    if (hasInteracted && !soundDisabled && !hasSpokenWelcome.current && !gameStarted && !isDailyMode && !showDemo) {
      const timer = setTimeout(() => {
        speak("ยินดีต้อนรับสู่เกมฟังเสียงสัตว์ครับ... กติกาคือ ให้ฟังเสียง แล้วทายว่าเป็นเสียงของสัตว์ตัวไหนครับ... กดปุ่มเริ่มเล่นได้เลย");
        hasSpokenWelcome.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasInteracted, gameStarted, isDailyMode, showDemo, speak, soundDisabled]);

  // 3.2 เสียงบอกให้กดฟัง (เฉพาะข้อแรกเท่านั้น)
  useEffect(() => {
    if (soundDisabled) return;
    if (gameStarted && !gameCompleted && !soundPlayed && !hasGivenInstructions && questionsAnswered === 0) {
      const timer = setTimeout(() => {
        speak("กดปุ่มลำโพง... เพื่อฟังเสียงสัตว์ครับ");
        setHasGivenInstructions(true); // ✅ ทำให้อธิบายแค่ข้อแรก
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, gameCompleted, soundPlayed, currentAnimal, questionsAnswered, hasGivenInstructions, speak, soundDisabled]);

  // 3.3 เสียงหลังจากกดฟังแล้ว (ให้เลือกตอบ)
  useEffect(() => {
    if (soundDisabled) return;
    // เดิม: ถ้า gameStarted && soundPlayed && !answered จะพูดเสียงอะไรเอ่ย... (ลบออก)
    // ไม่ต้องพูดอะไรในช่วงนี้
  }, [gameStarted, soundPlayed, answered, speak, soundDisabled]);

  // 3.4 เสียงจบเกม
  useEffect(() => {
    if (soundDisabled) return;
    if (gameCompleted) {
      speak(`จบเกมแล้วครับ... คุณตอบถูก ${correctAnswers} ข้อ... เก่งมากครับ`);
    }
  }, [gameCompleted, correctAnswers, speak, soundDisabled]);

  // -----------------------------------------------------------------

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const maxQuestions = 5

  // ฟังก์ชันเริ่มเกม: สุ่มลำดับ 5 ตัวที่ไม่ซ้ำ
  const initializeGame = () => {
    // ... โค้ดอื่นๆ ...
    setQuestionsAnswered(0);
    setCorrectAnswers(0); // สำคัญมาก: ต้องล้างคะแนนเก่าทิ้งทุกครั้งที่เริ่มใหม่
    setAnswers([]);
    // ...existing code...
    cancel();
    setIsSaving(false); // ✅ Reset สถานะการบันทึก
    setHasGivenInstructions(false); // ✅ Reset เพื่อให้พูดอธิบายใหม่เมื่อเริ่มเกมใหม่
    const animalList = ANIMALS;
    const totalAnimals = animalList.length;
    // สร้าง Array ของ Index ทั้งหมด [0, 1, 2, ..., total-1]
    const allIndexes = Array.from({ length: totalAnimals }, (_, i) => i);
    // Shuffle (Fisher-Yates) เพื่อให้ลำดับไม่ซ้ำ
    for (let i = allIndexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndexes[i], allIndexes[j]] = [allIndexes[j], allIndexes[i]];
    }
    // ตัดมาใช้แค่ 5 ตัวแรก
    const animalIndexes = allIndexes.slice(0, Math.min(maxQuestions, totalAnimals));
    console.log('สุ่ม index สัตว์ 5 ข้อ:', animalIndexes);
    setUsedAnimalIndexes(animalIndexes);
    // เริ่มที่ข้อแรก (index ที่ 0 ใน array ที่สุ่มมา)
    const animal = animalList[animalIndexes[0]];
    if (!animal) return;
    // สร้างตัวเลือก (Options)
    const otherIndexes = Array.from({ length: totalAnimals }, (_, i) => i).filter(idx => idx !== animalIndexes[0]);
    const shuffled = otherIndexes.sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [animal,
      ...shuffled.map(idx => animalList[idx])
    ]
      .sort(() => Math.random() - 0.5)
      .map((a, i) => ({
        id: `option-${i}`,
        name: a.name,
        soundUrl: a.sound,
        imageUrl: a.image,
      }));
    setCurrentAnimal({
      id: `animal-0`,
      name: animal.name,
      soundUrl: animal.sound,
      imageUrl: animal.image,
    });
    setOptions(opts);
    setGameStarted(true);
    setGameCompleted(false);
    setSelectedAnswer(null);
    setAnswered(false);
    setSoundPlayed(false);
    setTotalTime(0);
  }

  // ฟังก์ชันโหลดข้อถัดไป: รับ index ข้อถัดไปเข้ามาโดยตรง
  const loadNextQuestion = (nextQuestionIndex: number) => {
    const animalList = ANIMALS;
    // ใช้ nextQuestionIndex เพื่อดึงสัตว์ตัวถัดไปจาก usedAnimalIndexes
    if (usedAnimalIndexes.length > nextQuestionIndex) {
      const animal = animalList[usedAnimalIndexes[nextQuestionIndex]];
      if (!animal) return;
      
      console.log('ข้อที่', nextQuestionIndex + 1, 'currentAnimal:', animal.name);
      
      const totalAnimals = animalList.length;
      const otherIndexes = Array.from({ length: totalAnimals }, (_, i) => i).filter(idx => idx !== usedAnimalIndexes[nextQuestionIndex]);
      const shuffled = otherIndexes.sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [animal,
        ...shuffled.map(idx => animalList[idx])
      ]
        .sort(() => Math.random() - 0.5)
        .map((a, i) => ({
          id: `option-${i}`,
          name: a.name,
          soundUrl: a.sound,
          imageUrl: a.image,
        }));

      setCurrentAnimal({
        id: `animal-${nextQuestionIndex}`,
        name: animal.name,
        soundUrl: animal.sound,
        imageUrl: animal.image,
      });
      setOptions(opts);
      setSelectedAnswer(null);
      setAnswered(false); // Reset answered immediately
      setSoundPlayed(false);
    }
  }

  const handleAnswer = (animalName: string) => {
  if (answered) return;
  
  const isCorrect = animalName === currentAnimal?.name;
  setSelectedAnswer(animalName);
  setAnswered(true);

  // 1. เพิ่มคะแนนทันทีถ้าถูก (ไม่ต้องรอคำนวณจาก Array ภายหลังเพื่อความแม่นยำ)
  if (isCorrect) {
    setCorrectAnswers(prev => prev + 1);
  }

  // 2. เก็บประวัติคำตอบ
  setAnswers(prev => [...prev, isCorrect]);

  // 3. นับจำนวนข้อที่ตอบแล้ว
  setQuestionsAnswered(prev => {
    const nextStep = prev + 1;
    
    // หน่วงเวลาเพื่อแสดงผลเฉลย (เขียว/แดง) ก่อนไปข้อถัดไป
    setTimeout(() => {
      if (nextStep < maxQuestions) {
        loadNextQuestion(nextStep);
      } else {
        setGameCompleted(true);
      }
    }, 1500);
    
    return nextStep;
  });
};

  useEffect(() => {
    if (!gameStarted || gameCompleted) return
    const timer = setInterval(() => { setTotalTime((prev: number) => prev + 1) }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted])

  // ✅ เพิ่ม useEffect สำหรับบันทึกคะแนนเมื่อจบเกม (ไม่บันทึกถ้าเป็น daily mode)
useEffect(() => {
  // บันทึกเมื่อจบเกม และไม่ได้อยู่ในโหมด Daily
  if (gameCompleted && !isSaving && !isDailyMode) {
    setIsSaving(true);
    const userId = localStorage.getItem('userId');
    
    // ใช้ค่าจาก correctAnswers ได้เลยเพราะเราอัปเดตไว้แล้วใน handleAnswer
    if (userId) {
      fetch('/api/game/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          gameType: 'animal-sound',
          score: correctAnswers // ใช้ค่านี้ตรงๆ
        })
      })
      .then(res => res.json())
      .catch(err => console.error('Error saving score:', err));
    }
  }
}, [gameCompleted, isSaving, isDailyMode, correctAnswers]);

  const playSound = () => {
    if (currentAnimal?.soundUrl) {
      const audio = new Audio(currentAnimal.soundUrl);
      audio.play().catch(e => console.error("Error playing sound:", e));
    }
    setSoundPlayed(true)
  }

  const stopDemo = useCallback(() => {
    setShowDemo(false);
    setDemoStep(0);
    setCurrentAnimal(null);
    setOptions([]);
    setSoundPlayed(false);
    setSelectedAnswer(null);
    setAnswered(false);
  }, [])

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted && hasInteracted) {
      initializeGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDailyMode, gameStarted, gameCompleted, hasInteracted]);

  useEffect(() => {
    if (showDemo && demoStep === 0) {
      const { currentAnimal: animal, options: opts } = generateAnimalSounds()
      setCurrentAnimal(animal)
      setOptions(opts)
      setSoundPlayed(false)
      setSelectedAnswer(null)
      setAnswered(false)
      
      // เริ่มขั้นตอนที่ 1 ทันที
      setTimeout(() => {
        setDemoStep(1)
        if (!soundDisabled) speak("ตัวอย่างการเล่น... เกมนี้จะให้คุณฟังเสียงสัตว์ แล้วเลือกรูปสัตว์ที่ตรงกับเสียงครับ")
      }, 500)
    }
  }, [showDemo, demoStep, soundDisabled, speak])

  useEffect(() => {
    if (!showDemo) return

    let timer: ReturnType<typeof setTimeout> | null = null

    if (demoStep === 1) {
      timer = setTimeout(() => {
        setDemoStep(2)
      }, 3500)
    }

    if (demoStep === 3) {
      timer = setTimeout(() => {
        setDemoStep(4)
      }, 3500)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showDemo, demoStep])

  // จัดการแต่ละขั้นตอนของ Demo แยกจากกัน
  useEffect(() => {
    if (!showDemo || !currentAnimal) return

    if (demoStep === 2) {
      // ขั้นตอน 2: เล่นเสียงอัตโนมัติ
      const timer = setTimeout(() => {
        if (!soundDisabled) speak("ตอนนี้กำลังเล่นเสียงสัตว์ให้ฟัง... ฟังให้ดีนะครับ")
        
        setTimeout(() => {
          if (currentAnimal?.soundUrl) {
            const audio = new Audio(currentAnimal.soundUrl)
            audio.play().catch(e => console.error("Error playing sound:", e))
          }
          setSoundPlayed(true)
          
          // ไปขั้นตอนถัดไปหลังเล่นเสียงเสร็จ
          setTimeout(() => {
            setDemoStep(3)
            if (!soundDisabled) speak("ได้ยินเสียงอะไรบ้างครับ... ตอนนี้ให้มองหารูปสัตว์ที่ตรงกับเสียงที่ได้ยิน")
          }, 3000)
        }, 2000)
      }, 1000)
      
      return () => clearTimeout(timer)
    }

    if (demoStep === 4) {
      // ขั้นตอน 4: เลือกคำตอบอัตโนมัติ
      const timer = setTimeout(() => {
        if (!soundDisabled) speak("ผมจะกดเลือกคำตอบที่ถูกต้องให้ดูนะครับ... เป็นสัตว์ตัวนี้เลย")
        
        setTimeout(() => {
          setSelectedAnswer(currentAnimal?.name || "")
          setAnswered(true)
          setDemoStep(5)
          
          setTimeout(() => {
            if (!soundDisabled) speak("เยี่ยมมาก... ตอบถูกแล้ว... เมื่อตอบถูกจะเห็นกรอบสีเขียว... ถ้าตอบผิดจะเป็นสีแดง และจะแสดงคำตอบที่ถูกต้องด้วยสีเขียว")
          }, 1000)
        }, 2000)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [demoStep, showDemo, currentAnimal, soundDisabled, speak])

  // คะแนนรวม = จำนวนที่ตอบถูก
  const successRate = correctAnswers

  // ✅ หน้าจอปลดล็อกเสียง
  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#d0f5e8] p-4 relative overflow-hidden">
        <ExactCartoonTheme />
        <div className="relative z-10 bg-white/95 p-10 rounded-[2rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-white">
          <div className="text-7xl mb-4 animate-bounce">🗣️</div>
          <h1 className="text-3xl font-black text-[#234d20] mb-4">เปิดเสียงบรรยาย</h1>
          <p className="text-[#1a3a1a] mb-8 text-lg font-medium">
            เพื่อให้ได้ยินเสียงสัตว์และคำบรรยาย กรุณากดปุ่มด้านล่างครับ
          </p>
          <button
            onClick={() => {
              setHasInteracted(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 mb-2"
          >
            🔊 เริ่มใช้งาน
          </button>
          <button
            onClick={() => {
              setHasInteracted(true);
              setSoundDisabled(true);
            }}
            className="w-full py-3 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold rounded-2xl text-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            🚫 ไม่ใช้เสียง
          </button>
        </div>
      </div>
    );
  }

  // --- Loading State (Daily Mode) ---
  if (isDailyMode && !gameStarted && !gameCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse relative overflow-hidden">
        <ExactCartoonTheme />
        <span className="relative z-10 bg-white/80 px-8 py-4 rounded-full shadow-lg">กำลังเตรียมเกม...</span>
      </div>
    );
  }

  // --- UI หลัก ---
  return (
    <div className="min-h-screen font-sans flex flex-col items-center relative overflow-hidden p-4 md:p-6">
      <ExactCartoonTheme />
      <div className="relative z-10 w-full flex flex-col items-center flex-1">
        {/* --- Header Bar --- */}
        {(gameStarted && !gameCompleted) && (
          <div className="w-full max-w-5xl bg-gradient-to-r from-[#f0f9ff] via-white to-[#e0e7ff] rounded-2xl shadow-xl px-10 py-5 mb-7 flex items-center justify-between sticky top-4 z-50 border-2 border-yellow-200 backdrop-blur-[6px] transition-all duration-300 min-h-[70px]">
            {!isDailyMode ? (
              <button
                onClick={() => {
                  setGameStarted(false);
                  setGameCompleted(false);
                  setShowDemo(false);
                  setCurrentAnimal(null);
                  setOptions([]);
                  setSelectedAnswer(null);
                  setAnswered(false);
                  setSoundPlayed(false);
                  setQuestionsAnswered(0);
                  setCorrectAnswers(0);
                  setTotalTime(0);
                }}
                className="bg-gradient-to-b from-yellow-200 to-yellow-100 px-6 py-3 rounded-full shadow-md border-2 border-yellow-200 flex items-center gap-3 transition-all duration-150 hover:scale-105 hover:shadow-[0_0_16px_2px_rgba(253,224,71,0.5)] active:scale-95 active:shadow-[0_0_24px_4px_rgba(253,224,71,0.7)] focus:outline-none"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xl font-bold text-yellow-700">เลิกเล่น</span>
              </button>
            ) : (
              <div className="px-6 py-3 bg-yellow-50 text-yellow-800 rounded-2xl font-bold flex items-center gap-2 shadow border border-yellow-100"><span>📅</span> ภารกิจประจำวัน</div>
            )}
            <div className="flex flex-col items-center">
              
            </div>
          </div>
        )}

        {/* --- Stats Bar --- */}
        {gameStarted && !gameCompleted && !showDemo && (
          <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-xl mb-3 animate-fade-in relative z-10">
            <div className="bg-gradient-to-b from-[#fffde4] via-[#fff9c4] to-[#ffe066] p-3 rounded-xl shadow flex flex-col items-center justify-center border border-yellow-200 min-w-[90px]">
              <p className="text-yellow-700 font-bold text-xs uppercase tracking-wider mb-0.5">เวลา</p>
              <p className="text-xl font-black text-yellow-800 tabular-nums drop-shadow">{formatTime(totalTime)}</p>
            </div>
            <div className="bg-gradient-to-b from-[#fffde4] via-[#fff9c4] to-[#ffe066] p-3 rounded-xl shadow flex flex-col items-center justify-center border border-yellow-200 min-w-[90px]">
              <p className="text-yellow-700 font-bold text-xs uppercase tracking-wider mb-0.5">ข้อ</p>
              <p className="text-xl font-black text-yellow-800 tabular-nums drop-shadow">{questionsAnswered}<span className="text-xl font-black text-yellow-800 tabular-nums opacity-70"> / {maxQuestions}</span></p>
            </div>
          </div>
        )}

        {/* --- Main Content Area --- */}
        <div className="flex-1 flex items-center justify-center w-full my-0 animate-fade-in z-20">
          {/* --- Demo --- */}
          {showDemo ? (
            <div className="w-full max-w-3xl relative">
              {/* คำอธิบายขั้นตอน */}
              <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-xl border-4 border-blue-300 relative overflow-hidden">
                <button
                  onClick={stopDemo}
                  className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white font-black rounded-full px-5 py-2 shadow-lg ring-2 ring-white/80 transition-transform hover:scale-105"
                >
                  ✖ ปิดตัวอย่าง
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-black mb-3 flex items-center gap-3">
                    <span className="text-5xl">📖</span> 
                    <span>ตัวอย่างการเล่น</span>
                  </h2>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/30">
                    {demoStep === 1 && (
                      <p className="text-xl font-bold leading-relaxed">
                        🎯 ขั้นตอนที่ 1: ทำความเข้าใจกติกา<br/>
                        <span className="text-lg font-normal">เกมนี้จะให้คุณฟังเสียงสัตว์ แล้วเลือกรูปสัตว์ที่ตรงกับเสียงนั้น</span>
                      </p>
                    )}
                    {demoStep === 2 && (
                      <p className="text-xl font-bold leading-relaxed">
                        🔊 ขั้นตอนที่ 2: ฟังเสียงสัตว์<br/>
                        <span className="text-lg font-normal">ระบบจะเล่นเสียงสัตว์ให้ฟังอัตโนมัติ และฟังให้ดีว่าเป็นเสียงอะไร</span>
                      </p>
                    )}
                    {demoStep === 3 && (
                      <p className="text-xl font-bold leading-relaxed">
                        🤔 ขั้นตอนที่ 3: มองหารูปสัตว์<br/>
                        <span className="text-lg font-normal">ดูรูปสัตว์ทั้ง 4 ตัว แล้วเลือกตัวที่ตรงกับเสียงที่ได้ยิน</span>
                      </p>
                    )}
                    {demoStep === 4 && (
                      <p className="text-xl font-bold leading-relaxed">
                        👆 ขั้นตอนที่ 4: เลือกคำตอบ<br/>
                        <span className="text-lg font-normal">กดเลือกรูปสัตว์ที่คิดว่าถูกต้อง</span>
                      </p>
                    )}
                    {demoStep === 5 && (
                      <p className="text-xl font-bold leading-relaxed">
                        ✅ ขั้นตอนที่ 5: ดูผลลัพธ์<br/>
                        <span className="text-lg font-normal">ถ้าตอบถูกจะเห็นกรอบสีเขียว 🟢 ถ้าตอบผิดจะเห็นกรอบสีแดง 🔴<br/>
                        จากนั้นเล่นต่อไปข้อถัดไปจนครบ 5 ข้อ</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* พื้นที่เกม */}
              {currentAnimal && options.length > 0 ? (
                <div className="w-full">
                  {/* ปุ่มเสียง */}
                  <div className={`card text-center mb-5 bg-white/90 rounded-2xl shadow-lg p-6 transition-all duration-300 ${demoStep === 2 ? 'ring-8 ring-yellow-400 scale-105 animate-pulse' : ''}`}>
                    <p className="text-xl text-green-700 mb-4 font-bold">
                      {demoStep === 2 ? '👇 ระบบจะเล่นเสียงให้ฟัง 👇' : 'ฟังเสียง และเลือกสัตว์'}
                    </p>
                    <button
                      disabled={demoStep !== 2}
                      className={`w-full text-2xl mb-3 rounded-2xl font-bold py-5 px-8 shadow-xl border-2 border-[#ffe066] bg-gradient-to-r from-[#ffe259] to-[#ffa751] text-white transition-all ${demoStep === 2 ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      style={{
                        textShadow: '0 2px 8px rgba(255, 193, 7, 0.25)',
                        boxShadow: '0 8px 24px 0 rgba(255, 193, 7, 0.18), 0 2px 8px 0 rgba(255, 193, 7, 0.10)'
                      }}
                    >
                      🔊 เล่นเสียง (อัตโนมัติ)
                    </button>
                    {soundPlayed && (
                      <p className="text-base text-green-700 font-semibold animate-fade-in">
                        ✅ ได้ยินเสียงแล้ว! ตอนนี้เลือกรูปสัตว์ที่ตรงกับเสียง
                      </p>
                    )}
                  </div>

                  {/* ตัวเลือกรูปภาพ */}
                  <div className={`transition-all duration-300 ${(demoStep === 3 || demoStep === 4) ? 'ring-8 ring-green-400 rounded-3xl p-2' : ''}`}>
                    {(demoStep === 3 || demoStep === 4) && (
                      <p className="text-center text-2xl font-black text-green-700 mb-3 animate-bounce">
                        👇 เลือกรูปสัตว์ที่ตรงกับเสียง 👇
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {options.map((option) => {
                        let extraClass = '';
                        let isCorrectAnswer = option.name === currentAnimal?.name;
                        
                        if (answered) {
                          if (isCorrectAnswer) {
                            extraClass = 'bg-green-200 border-green-500 ring-8 ring-green-400 scale-105';
                          } else if (selectedAnswer === option.name) {
                            extraClass = 'bg-red-200 border-red-500 ring-8 ring-red-400 scale-105';
                          }
                        }
                        
                        // ไฮไลท์คำตอบที่ถูกต้องในขั้นตอนที่ 4 (ก่อนกด)
                        if (demoStep === 4 && !answered && isCorrectAnswer) {
                          extraClass = 'ring-8 ring-yellow-400 animate-pulse';
                        }
                        
                        return (
                          <button
                            key={option.name}
                            disabled={true}
                            className={`py-6 px-2 rounded-2xl font-bold transition-all text-green-700 shadow-xl border-2 bg-white flex flex-col items-center justify-center ${extraClass}`}
                          >
                            <img 
                              src={option.imageUrl}
                              alt={option.name}
                              style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                            />
                            <span className="text-xl font-bold mt-2">{option.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ไม่มีปุ่มควบคุมในโหมดตัวอย่างเล่นอัตโนมัติ */}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 animate-spin">⏳</div>
                  <p className="text-2xl font-bold text-slate-600">กำลังเตรียมตัวอย่าง...</p>
                </div>
              )}
            </div>
          ) : !gameStarted ? (
            <div className="w-full max-w-xl flex flex-col items-center animate-fade-in my-auto pb-16 relative">

              <div className="text-center mb-6">
                <div className="inline-block p-6 bg-white rounded-[2.5rem] shadow-lg mb-4 border-4 border-[#e0e7ee]" style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.08)' }}>
                  <span className="text-8xl filter drop-shadow-lg">🐕</span>
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-[#234d20] mb-3 tracking-tight drop-shadow-lg">เกมฟังเสียงสัตว์</h1>
                <p className="text-xl text-[#1a3a1a] font-bold mb-0.5">ฝึกฟังเสียงและจำแนกสัตว์</p>
                <p className="text-base text-[#234d20] font-medium">ฟังเสียงแล้วเลือกสัตว์ที่ถูกต้อง</p>
              </div>
                {/* ปุ่มฟังคำแนะนำ + ตัวอย่างการเล่น */}
                <div className="flex flex-row justify-center mb-8 gap-4 items-center w-full">
                  <button
                    onClick={() => speak("กติกา: กดปุ่มลำโพงเพื่อฟังเสียงสัตว์ แล้วเลือกภาพสัตว์ที่ตรงกับเสียงให้ถูกต้อง")}
                    className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                  >
                    <span className="text-xl">🔊</span>
                    <span>ฟังคำแนะนำ</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDemo(true);
                      setDemoStep(0);
                      setCurrentAnimal(null);
                      setOptions([]);
                      setSoundPlayed(false);
                      setSelectedAnswer(null);
                      setAnswered(false);
                    }}
                    className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-yellow-400"
                  >
                    <span className="text-xl">💡</span>
                    <span>ตัวอย่างการเล่น</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs items-center">
                  <button
                    onClick={() => {
                      if (!soundDisabled) {
                        speak("เริ่มเกมครับ... กดปุ่มลำโพง เพื่อฟังเสียงสัตว์ได้เลยครับ");
                      }
                      initializeGame();
                    }}
                    className="w-full py-3.5 rounded-[2rem] text-xl font-black shadow-md transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:scale-105 hover:shadow-lg cursor-pointer"
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
              <div className="card text-center bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-10 border-[8px] border-white/50 ring-4 ring-yellow-200">
                <div className="text-9xl mb-4 animate-bounce drop-shadow-md">🎉</div>
                <h2 className="text-6xl font-black text-yellow-900 mb-4 tracking-tight">เก่งมาก!</h2>
                <p className="text-2xl text-slate-500 mb-10 font-medium bg-slate-50 inline-block px-6 py-2 rounded-full">{isDailyMode ? 'ภารกิจส่วนนี้เสร็จสิ้นแล้ว' : 'คุณฟังเสียงสัตว์ได้ครบทุกตัวแล้ว'}</p>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-100 col-span-2 flex flex-col items-center justify-center">
                    <p className="text-yellow-600 font-bold text-lg mb-1 uppercase tracking-wider">คะแนน</p>
                    <p className="text-5xl font-black text-yellow-800">{correctAnswers} / {maxQuestions}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 col-span-2">
                    <p className="text-blue-600 font-bold text-lg mb-1 uppercase tracking-wider">ใช้เวลา</p>
                    <p className="text-5xl font-black text-blue-800">{formatTime(totalTime)}</p>
                  </div>
                </div>
                {isDailyMode ? (
                  <button
                    onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)}
                    className="w-full py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl font-bold rounded-2xl shadow-xl shadow-green-200 transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    ✅ ผ่านด่าน (ไปต่อ)
                  </button>
                ) : (
                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() => {
                        cancel();
                        setGameStarted(false);
                        setGameCompleted(false);
                        setShowDemo(false);
                        setCurrentAnimal(null);
                        setOptions([]);
                        setSelectedAnswer(null);
                        setAnswered(false);
                        setSoundPlayed(false);
                        setQuestionsAnswered(0);
                        setCorrectAnswers(0);
                        setTotalTime(0);
                      }}
                      className="w-full py-5 px-2 bg-gradient-to-r from-[#34d399] to-[#059669] hover:from-[#6ee7b7] hover:to-[#047857] active:from-[#059669] active:to-[#34d399] text-white font-bold text-2xl rounded-2xl shadow-xl border-2 border-[#059669] transition-all drop-shadow-lg"
                      style={{
                        textShadow: '0 2px 8px rgba(34, 211, 102, 0.18)',
                        boxShadow: '0 8px 24px 0 rgba(34, 211, 102, 0.18), 0 2px 8px 0 rgba(34, 211, 102, 0.10)'
                      }}
                    >
                      กลับหน้าแรก
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : currentAnimal && options.length > 0 ? (
            <div className="w-full max-w-xl">
              <div className="card text-center mb-5 bg-white/90 rounded-2xl shadow-lg p-6">
                <p className="text-xl text-green-700 mb-4">ฟังเสียง และเลือกสัตว์</p>
                <button
                  onClick={playSound}
                  className={`w-full text-2xl mb-5 rounded-2xl font-bold py-5 px-8 shadow-xl border-2 border-[#ffe066] bg-gradient-to-r from-[#ffe259] to-[#ffa751] hover:from-[#fff6b7] hover:to-[#fcd34d] active:from-[#fcd34d] active:to-[#fbbf24] text-white transition-all ${soundPlayed ? 'scale-95' : ''}`}
                  style={{
                    textShadow: '0 2px 8px rgba(255, 193, 7, 0.25)',
                    boxShadow: '0 8px 24px 0 rgba(255, 193, 7, 0.18), 0 2px 8px 0 rgba(255, 193, 7, 0.10)'
                  }}
                >
                  🔊 {soundPlayed ? 'เล่นเสียง' : 'เล่นเสียง'}
                </button>
                <p className="text-base text-green-700 mb-4">{soundPlayed ? 'เลือกรูปสัตว์ที่ตรงกับเสียง' : 'กดปุ่มเพื่อเล่นเสียง'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {options.map((option) => {
                  let extraClass = '';
                  if (answered) {
                    if (option.name === currentAnimal?.name) {
                      extraClass = 'bg-green-200 border-green-400';
                    } else if (selectedAnswer === option.name) {
                      if (selectedAnswer !== currentAnimal?.name) {
                        extraClass = 'bg-red-200 border-red-400';
                      }
                    }
                  }
                  return (
                    <button
                      key={option.name}
                      onClick={() => handleAnswer(option.name)}
                      disabled={answered || !soundPlayed}
                      className={`py-6 px-2 rounded-2xl font-bold transition-all text-green-700 shadow-xl border-2 bg-white hover:bg-[#f7fbe8] active:bg-[#e6ffe6] flex flex-col items-center justify-center ${selectedAnswer === option.name ? option.name === currentAnimal?.name ? 'ring-4 ring-green-400 scale-105' : 'ring-4 ring-red-400 scale-105' : 'hover:scale-105'} ${answered || !soundPlayed ? 'opacity-60' : ''} ${extraClass}`}
                    >
                      <img 
                        src={option.imageUrl}
                        alt={option.name}
                        style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                      />
                      <span className="text-xl font-bold mt-2">{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AnimalSoundGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>}>
      <AnimalSoundGameContent />
    </Suspense>
  )
}
