'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateColorCards } from '@/utils/gameUtils'
import { useTTS } from '@/hooks/useTTS' // ✅ 1. เรียกใช้ Hook เสียง

// ==========================================
// ☁️ ธีมก้อนเมฆ "แบบดราฟต์จากรูปต้นฉบับ" (Vector Traced Theme)
// ==========================================
const ExactCartoonTheme = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#fbc2eb]">
      {/* 1. ท้องฟ้าไล่สี (Gradient Sky) - ไล่จากม่วงเข้ม > ชมพู > ส้ม > เหลืองอ่อน (Sunset) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e0e7ff] via-[#bae6fd] via-70% to-[#f0f9ff]"></div>

      {/* 2. เมฆลอย (Floating Clouds) - วาดทรงรีๆ มนๆ แบบการ์ตูน */}
      {/* ซ้ายบน */}
      <svg className="absolute top-[10%] left-[5%] w-40 h-24 text-white/30 animate-float-slow" viewBox="0 0 200 120" fill="currentColor">
        <path d="M20,80 Q40,40 70,50 T130,50 T180,80 Q190,100 160,110 H40 Q10,100 20,80 Z" />
      </svg>
      {/* ขวาบน */}
      <svg className="absolute top-[15%] right-[8%] w-32 h-20 text-white/30 animate-float-delayed" viewBox="0 0 200 120" fill="currentColor">
        <path d="M10,70 Q30,30 80,40 T150,50 T190,80 Q195,100 150,105 H50 Q5,90 10,70 Z" />
      </svg>

      {/* 3. ☁️ พื้นเมฆด้านล่าง (Cloud Floor) - ดราฟต์เส้นให้โค้งเว้าเหมือนรูปเป๊ะๆ */}
      <div className="absolute bottom-0 w-full h-auto">
         
         {/* ชั้นหลัง (Layer 2) - สีจางกว่า สูงกว่านิดหน่อย */}
         <svg className="absolute bottom-0 w-full h-[280px] md:h-[400px] text-white/40 transform scale-110 origin-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,192 C150,120 300,150 400,180 C550,220 650,120 800,140 C950,160 1050,220 1200,200 C1350,180 1400,100 1440,120 V320 H0 Z" />
         </svg>

         {/* ชั้นหน้า (Layer 1) - สีขาวทึบ ขอบมนใหญ่ๆ แบบในรูป */}
         <svg className="relative w-full h-[220px] md:h-[320px] text-white drop-shadow-md" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
            {/* เส้น Path นี้ดัดให้มีความ "อ้วนกลม" เหมือนปุยเมฆในรูปตัวอย่าง */}
            <path d="M0,256 C120,200 240,160 360,192 C480,224 550,280 680,260 C800,240 880,160 1000,170 C1150,180 1250,240 1360,220 C1400,210 1420,200 1440,220 V320 H0 Z" />
         </svg>
      </div>
    </div>
  );
};

interface ColorCard {
  id: string; color: string; colorName?: string; shape?: string; isFlipped: boolean; isMatched: boolean;
}

export default function ColorMatchingGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get('level');
  const isDailyMode = searchParams.get('mode') === 'daily';
  const dailyStep = searchParams.get('dailyStep'); 

  // ✅ 2. แทรก Hook เสียงตรงนี้ (ไม่กระทบ Logic เกม)
  const { speak, cancel } = useTTS();
  const [hasInteracted, setHasInteracted] = useState(false);
  // ✅ แทรกโค้ดนี้ลงไปบรรทัดถัดมาได้เลยครับ
  useEffect(() => {
    if (isDailyMode) {
        setHasInteracted(true);
    }
  }, [isDailyMode]);
  const hasSpokenWelcome = useRef(false);
  const [soundDisabled, setSoundDisabled] = useState(false);

  // ✅ เพิ่ม State สำหรับกันการบันทึกซ้ำ
  const [isSaving, setIsSaving] = useState(false);

  const [cards, setCards] = useState<ColorCard[]>([])
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const getPairCount = () => difficulty === 2 ? 15 : 10;
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewTimer, setPreviewTimer] = useState(0) 
  const [totalTime, setTotalTime] = useState(0)
  const [moves, setMoves] = useState(0)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const matchSoundRef = useRef<HTMLAudioElement | null>(null)
  const applauseSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/sounds/Soundeffect/Tingsound.mp3')
    audio.preload = 'auto'
    matchSoundRef.current = audio
    return () => {
      audio.pause()
      matchSoundRef.current = null
    }
  }, [])

  useEffect(() => {
    const applauseAudio = new Audio('/sounds/Soundeffect/Applause.mp3')
    applauseAudio.load()
    applauseSoundRef.current = applauseAudio
    return () => {
      applauseAudio.pause()
      applauseSoundRef.current = null
    }
  }, [])

  // -------------------------------------------------------------
  // 🔊 3. ระบบนักพากย์ (Narrator Logic) - ทำงานเงียบๆ
  // -------------------------------------------------------------

  // 3.1 เสียงต้อนรับ
  useEffect(() => {
    if (hasInteracted && !hasSpokenWelcome.current && !gameStarted && !isDailyMode && !showDemo && !soundDisabled) {
       setTimeout(() => {
         speak("ยินดีต้อนรับสู่เกมจับคู่สีครับ... กติกาคือ ให้จำตำแหน่งของสีต่างๆ... แล้วจับคู่ให้ถูกต้องนะครับ... เลือกความยากเพื่อเริ่มเล่นได้เลย");
         hasSpokenWelcome.current = true;
       }, 1000);
    }
  }, [hasInteracted, gameStarted, isDailyMode, showDemo, speak, soundDisabled]);

  // 3.2 เสียงตอนเริ่มจำ (Preview Phase)
  useEffect(() => {
    if (gameStarted && previewing && previewTimer === 10 && !soundDisabled) {
        speak("จำตำแหน่งของสีเหล่านี้ให้ดีนะครับ... มีเวลาจำ 10 วินาที... เริ่มจำได้เลยครับ");
    }
  }, [gameStarted, previewing, previewTimer, speak, soundDisabled]);

  // 3.3 เสียงตอนหมดเวลาจำ (Start Playing)
  useEffect(() => {
    if (gameStarted && !previewing && !gameCompleted && totalTime === 0 && !soundDisabled) {
        // พูดเมื่อ Preview จบและเวลาเล่นเริ่มนับ
        speak("หมดเวลาจำแล้วครับ... จับคู่สีที่เหมือนกันได้เลยครับ");
    }
  }, [gameStarted, previewing, gameCompleted, totalTime, speak, soundDisabled]);

  // 3.4 เสียงจบเกม
  useEffect(() => {
    if (gameCompleted && !soundDisabled) {
        speak(`เก่งมากครับ... คุณจับคู่สีได้ครบทุกใบแล้ว... สุดยอดไปเลยครับ`);
    }
  }, [gameCompleted, speak, soundDisabled]);

  // 3.5 เสียงปรบมือตอนจบเกม
  useEffect(() => {
    if (gameCompleted && applauseSoundRef.current && !soundDisabled) {
      applauseSoundRef.current.currentTime = 0;
      applauseSoundRef.current.play();
    }
  }, [gameCompleted, soundDisabled]);

  // -------------------------------------------------------------

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    // เพิ่มเสียงพูดตอนกดเลือก
    if (!soundDisabled) speak(level === 1 ? "ระดับธรรมดาครับ" : "ระดับยากครับ");
  };

  const handleStartGame = () => {
    if (selectedLevel) {
      if (!soundDisabled) speak("เริ่มเกมครับ"); // เพิ่มเสียงพูดตอนกดเริ่ม
      startGame(selectedLevel);
    }
  };

  const startGame = (level: number) => {
    cancel(); // หยุดเสียงเก่า
    setIsSaving(false); // ✅ Reset สถานะการบันทึก
    const lvl = Math.max(1, Math.min(2, level))
    setDifficulty(lvl)
    // ส่ง difficulty (1=ธรรมดา, 2=ยาก) ให้ generateColorCards เพื่อให้ logic ใน gameUtils ทำงานถูกต้อง
    const newCards = generateColorCards(lvl).map((c) => ({ ...c, isFlipped: true, isMatched: false }))
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setTotalTime(0)
    setGameCompleted(false)
    setGameStarted(true)
    setPreviewing(true)
    setPreviewTimer(10) 
  }

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted && levelParam) {
      startGame(parseInt(levelParam, 10) || 1);
    }
  }, [isDailyMode, levelParam, gameStarted, gameCompleted]);

  useEffect(() => {
    if (!previewing || previewTimer <= 0) {
      if (previewing && previewTimer <= 0) {
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })))
        setPreviewing(false)
      }
      return
    }
    const timer = setInterval(() => { setPreviewTimer((prev) => prev - 1) }, 1000)
    return () => clearInterval(timer)
  }, [previewing, previewTimer])

  useEffect(() => {
    if (!gameStarted || gameCompleted || previewing) return
    const timer = setInterval(() => { setTotalTime((prev) => prev + 1) }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted, previewing])

  // ✅ เพิ่ม useEffect สำหรับบันทึกคะแนนเมื่อจบเกม (ไม่บันทึกถ้าเป็น daily mode)
  useEffect(() => {
    if (gameCompleted && !isSaving && !isDailyMode) {
      setIsSaving(true);
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch('/api/game/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            gameType: 'color-matching',
            score: matchedPairs // ใช้จำนวนคู่ที่จับได้เป็นคะแนน
          })
        })
        .then(res => res.json())
        .then(data => console.log('Score saved:', data))
        .catch(err => console.error('Error saving score:', err));
      }
    }
  }, [gameCompleted, isSaving, matchedPairs, isDailyMode]);

  const handleCardClick = (cardId: string) => {
    if (previewing || gameCompleted) return 
    const clicked = cards.find((c) => c.id === cardId)
    if (!clicked || clicked.isMatched || flippedCards.includes(cardId)) return
    if (flippedCards.length >= 2) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    setMoves((m) => m + 1)

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped
      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = cards.find((c) => c.id === secondId)

      if (firstCard && secondCard && firstCard.color === secondCard.color) {
        setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)))
        setMatchedPairs((m) => m + 1)
        setFlippedCards([])
        // speak("ถูกต้องครับ"); // (ตัวเลือกเสริม: ถ้าอยากให้พูดตอนถูก)
      } else {
        setTimeout(() => { setFlippedCards([]) }, 1000)
      }
    }
  }

  // เล่นเสียงเมื่อจับคู่ได้
  useEffect(() => {
    if (matchedPairs > 0 && matchSoundRef.current) {
      setTimeout(() => {
        if (matchSoundRef.current) {
          matchSoundRef.current.currentTime = 0
          const promise = matchSoundRef.current.play()
          if (promise !== undefined) {
            promise.catch(() => console.log('Audio play failed'))
          }
        }
      }, 100)
    }
  }, [matchedPairs])

  useEffect(() => {
    if (!gameStarted) return
    const totalPairs = Math.floor(cards.length / 2)
    if (matchedPairs > 0 && matchedPairs === totalPairs) { 
      setTimeout(() => {
        setGameCompleted(true);
      }, 800);
    }
    }, [matchedPairs, cards, gameStarted, gameCompleted])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const startDemo = () => {
    setShowDemo(true)
    setDemoStep(0)
    
    // สร้างไพ่ตัวอย่าง (4 ใบ, 2 คู่)
    const demoCards: ColorCard[] = [
      { id: 'demo-1', color: '#FF6B6B', colorName: 'แดง', isFlipped: true, isMatched: false },
      { id: 'demo-2', color: '#4ECDC4', colorName: 'เขียวขาว', isFlipped: true, isMatched: false },
      { id: 'demo-3', color: '#FF6B6B', colorName: 'แดง', isFlipped: true, isMatched: false },
      { id: 'demo-4', color: '#4ECDC4', colorName: 'เขียวขาว', isFlipped: true, isMatched: false }
    ]
    
    setCards(demoCards)
    setFlippedCards([])
    setGameStarted(false)
    setPreviewing(false)
    setMatchedPairs(0)
    setMoves(0)
    setTotalTime(0)
    
    // ลำดับการแสดงตัวอย่าง (ช้าเหมาะสมสำหรับผู้สูงอายุ)
    demoTimeoutRef.current = setTimeout(() => {
      setDemoStep(1) // แสดงไพ่ทั้งหมด
      if (!soundDisabled) speak("ตัวอย่างการเล่น... มี 4 ใบ ประกอบด้วย 2 คู่ครับ... สีแดง 2 ใบ สีเขียวขาว 2 ใบ")
      
      demoTimeoutRef.current = setTimeout(() => {
        setDemoStep(2)
        setFlippedCards(['demo-1']) // เปิดไพ่แรก
        if (!soundDisabled) speak("คลิกที่ไพ่เพื่อเปิด... ไพ่แรกคือสีแดงครับ")
        
        demoTimeoutRef.current = setTimeout(() => {
          setDemoStep(3)
          setFlippedCards(['demo-1', 'demo-3']) // เปิดไพ่ที่มีสีเดียวกัน
          if (!soundDisabled) speak("เปิดไพ่ที่สองครับ... โอ๊ะ เป็นสีแดงเหมือนกัน... มันจับคู่ถูกแล้ว")
          
          demoTimeoutRef.current = setTimeout(() => {
            setDemoStep(4)
            setMatchedPairs(1)
            setMoves(1)
            if (!soundDisabled) speak("ยอดเยี่ยม... ได้ 1 คู่แล้วครับ... จับคู่ไพ่ที่เหลือต่อเลยครับ")
            
            demoTimeoutRef.current = setTimeout(() => {
              setDemoStep(5)
              setFlippedCards(['demo-1', 'demo-3', 'demo-2'])
              if (!soundDisabled) speak("เปิดไพ่อีกใบ... สีเขียวขาวครับ")
              
              demoTimeoutRef.current = setTimeout(() => {
                setDemoStep(6)
                setFlippedCards(['demo-1', 'demo-3', 'demo-2', 'demo-4'])
                setMatches(2)
                if (!soundDisabled) speak("เปิดไพ่สุดท้าย... สีเขียวขาวเหมือนกัน... จับคู่สมบูรณ์แล้ว")
                
                demoTimeoutRef.current = setTimeout(() => {
                  setDemoStep(7)
                  if (!soundDisabled) speak("เก่งมากครับ... ทำแบบนี้ไปเรื่อยๆ จนกว่าจะจับคู่ไพ่ได้หมดครับ")
                }, 5000)
              }, 5000)
            }, 5000)
          }, 5000)
        }, 5000)
      }, 5000)
    }, 2000)
  }

  const setMatches = (count: number) => {
    setMatchedPairs(count)
  }
  const closeDemo = () => { setShowDemo(false); if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current); }

  // ✅ 4. หน้าจอปลดล็อกเสียง (จำเป็นต้องมีเพื่อให้เสียงออกบน iPad/iPhone)
  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbc2eb] p-4 relative overflow-hidden">
        <ExactCartoonTheme />
        <div className="relative z-10 bg-white/95 p-10 rounded-[2rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-white">
          <div className="text-7xl mb-4 animate-bounce">🗣️</div>
          <h1 className="text-3xl font-black text-[#1e3a8a] mb-4">เปิดเสียงบรรยาย</h1>
          <p className="text-slate-600 mb-8 text-lg font-medium">
              ระบบเสียงพร้อมแล้ว กดปุ่มเพื่อเริ่มเล่นได้เลยครับ
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

  if (isDailyMode && !gameStarted && !gameCompleted) return <div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse relative overflow-hidden"><ExactCartoonTheme /><span className="relative z-10 bg-white/80 px-8 py-4 rounded-full shadow-lg">กำลังเตรียมเกม...</span></div>;

  return (
    <div className="min-h-screen font-sans flex flex-col items-center relative overflow-hidden p-4 md:p-6">
      {/* ☁️ พื้นหลังท้องฟ้าและเมฆ (Vector Traced) */}
      <ExactCartoonTheme />

      <div className="relative z-10 w-full flex flex-col items-center flex-1">

      {/* --- Welcome Screen --- */}
      {!gameStarted && !showDemo && !isDailyMode && (
        <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in my-auto pb-40"> 
          
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#FFD180] rounded-[2rem] shadow-sm mb-3 transform -rotate-3 hover:rotate-3 transition-transform">
              <span className="text-7xl filter drop-shadow-sm">🎨</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#1e3a8a] mb-2 tracking-tight drop-shadow-sm">
              เกมจับคู่สี
            </h1>
            <p className="text-xl text-slate-700 font-bold mb-1">ฝึกความจำและการสังเกต</p>
            <p className="text-lg text-slate-500 font-medium">จำตำแหน่งสี แล้วจับคู่ให้ถูกต้อง</p>
          </div>


          {/* ฟังคำแนะนำ and Demo Buttons */}
          <div className="flex justify-center gap-4 w-full mb-6">
            <button 
              onClick={() => speak("เลือกระดับความยาก เพื่อเริ่มเล่นได้เลยครับ")}
              className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-indigo-700 bg-white/90 hover:bg-white border-indigo-200"
            >
              <span className="text-2xl">🔊</span>
              <span>ฟังคำแนะนำ</span>
            </button>
            <button
              onClick={startDemo}
              className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-[#EAB308]"
            >
              <span className="text-2xl">💡</span>
              <span>ตัวอย่างการเล่น</span>
            </button>
          </div>

          {/* Level Buttons (ปรับให้เหมือนรูปเป๊ะ: พื้นขาว ขอบมน เงาฟุ้ง) */}
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center items-stretch mb-10 px-4">
            {/* ระดับธรรมดา */}
            <button
              onClick={() => handleSelectLevel(1)}
              className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                ${selectedLevel === 1 
                  ? 'border-[#60A5FA] shadow-[0_0_20px_rgba(96,165,250,0.6)] scale-105 z-20 ring-4 ring-blue-100' 
                  : 'border-transparent shadow-lg hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl'
                }`}
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">😊</div>
              <h3 className={`text-3xl font-black mb-2 ${selectedLevel === 1 ? 'text-[#2563EB]' : 'text-[#1e3a8a]'}`}>ระดับธรรมดา</h3>
              <p className="text-sm text-slate-500 font-bold">จำนวนไพ่น้อย เริ่มต้นฝึกฝน</p>
            </button>

            {/* ระดับยาก */}
            <button
              onClick={() => handleSelectLevel(2)}
              className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                ${selectedLevel === 2 
                  ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105 z-20 ring-4 ring-purple-100' 
                  : 'border-transparent shadow-lg hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl'
                }`}
            >
              <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">🤓</div>
              <h3 className={`text-3xl font-black mb-2 ${selectedLevel === 2 ? 'text-[#7C3AED]' : 'text-[#581c87]'}`}>ระดับยาก</h3>
              <p className="text-sm text-slate-500 font-bold">ท้าทายความจำ จำนวนไพ่เยอะขึ้น</p>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4 relative z-20">
            {/* Start Button (Gradient Purple) */}
            <button
              onClick={handleStartGame}
              disabled={!selectedLevel}
              className={`w-full py-4 rounded-2xl text-2xl font-black shadow-lg transition-all duration-200
                ${selectedLevel 
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white hover:scale-105 hover:shadow-purple-300/50 cursor-pointer border-b-4 border-[#7E22CE]' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400'
                }`}
            >
               เริ่มเล่น
            </button>
            

            {/* Back Button (Blue) */}
            <button 
              onClick={() => { cancel(); router.push('/welcome'); }}
              className="px-8 py-3 rounded-2xl bg-[#3B82F6] text-white font-bold text-lg hover:bg-[#2563EB] transition-all shadow-md flex items-center gap-2 border-b-4 border-[#1D4ED8]"
            >
              <span>⬅</span> กลับหน้าหลัก
            </button>
            </div>
          

        </div>
      )}

      {/* --- Game Screen --- */}
      {(gameStarted || showDemo || gameCompleted) && (
        <>
        {/* Header Bar */}
        {!showDemo && !gameCompleted && (
          <div className="w-full max-w-5xl bg-gradient-to-r from-[#f0f9ff] via-white to-[#e0e7ff] rounded-2xl shadow-xl px-10 py-5 mb-7 flex items-center justify-between sticky top-4 z-50 border-2 border-purple-200 backdrop-blur-[6px] transition-all duration-300 min-h-[70px]">
            {!isDailyMode ? (
              <button
                onClick={() => { cancel(); setGameStarted(false); setPreviewing(false); setSelectedLevel(null); }}
                className="flex items-center gap-3 text-xl font-bold text-purple-700 hover:text-purple-900 transition-colors focus:outline-none"
              >
                <span
                  className="bg-gradient-to-b from-purple-300 to-purple-200 p-3 rounded-full px-6 shadow-md border-2 border-purple-300 flex items-center gap-2 transition-all duration-150
                  hover:scale-105 hover:shadow-[0_0_16px_2px_rgba(168,139,250,0.5)] active:scale-95 active:shadow-[0_0_24px_4px_rgba(168,139,250,0.7)]"
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="28" height="28" rx="8" fill="url(#purpleBtn)"/>
                    <path d="M17.5 8L12 14L17.5 20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="purpleBtn" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a78bfa"/>
                        <stop offset="1" stopColor="#c4b5fd"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-xl font-bold text-purple-700">กลับ</span>
                </span>
              </button>
            ) : (
              <div className="px-6 py-3 bg-yellow-50 text-yellow-800 rounded-2xl font-bold flex items-center gap-2 shadow border border-yellow-100"><span>📅</span> ภารกิจประจำวัน</div>
            )}
            <div className="hidden md:flex flex-col items-center">
              <span className="text-sm font-bold text-blue-300 uppercase tracking-widest">LEVEL</span>
              <span className="text-2xl font-black text-blue-700 drop-shadow-sm">{difficulty === 1 ? 'ระดับธรรมดา' : 'ระดับยาก'}</span>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {!gameCompleted && !showDemo && (
          <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-2xl mb-6 animate-fade-in relative z-10">
            <div className="bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] p-4 rounded-xl shadow-md flex flex-col items-center justify-center border-2 border-purple-200 min-w-[110px]">
              <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">เวลา</p>
              <p className="text-2xl font-black text-blue-600 tabular-nums drop-shadow">{formatTime(totalTime)}</p>
            </div>
            <div className="bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] p-4 rounded-xl shadow-md flex flex-col items-center justify-center border-2 border-purple-200 min-w-[110px]">
              <p className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">คู่ที่ได้</p>
              <p className="text-2xl font-black text-cyan-600 tabular-nums drop-shadow">
                {matchedPairs}
                <span className="text-2xl font-black text-cyan-600 tabular-nums opacity-70"> / {getPairCount()}</span>
              </p>
            </div>
            <div className="bg-gradient-to-b from-white via-[#f0f9ff] to-[#e0e7ff] p-4 rounded-xl shadow-md flex flex-col items-center justify-center border-2 border-purple-200 min-w-[110px]">
              <p className="text-green-400 font-bold text-xs uppercase tracking-wider mb-1">ครั้ง</p>
              <p className="text-2xl font-black text-green-600 tabular-nums drop-shadow">{moves}</p>
            </div>
          </div>
        )}

        {/* Demo Area */}
        {showDemo && (
            <div className="flex-1 flex items-center justify-center w-full my-auto animate-fade-in z-20">
                <div className="w-full max-w-4xl">
                  {/* Card ตัวอย่างการเล่น */}
                  <div className="bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 md:p-12 border-8 border-white/50 ring-4 ring-yellow-200 relative overflow-hidden animate-fade-in">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 animate-bounce-slow">
                        <span className="text-6xl">💡</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-2">ตัวอย่างการเล่น</h2>
                      <p className="text-lg text-slate-600 font-medium">มาดูวิธีเล่นกันเลย!</p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex justify-center gap-2 mb-8">
                      {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                        <div key={step} className={`w-10 h-2 rounded-full transition-all duration-500 ${demoStep >= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>

                    {/* คำอธิบายแต่ละ Step */}
                    <div className="mb-8">
                      {demoStep === 0 && (
                        <div className="text-center p-6 bg-blue-50 rounded-2xl animate-fade-in">
                          <p className="text-2xl font-bold text-blue-800">กำลังเริ่มต้น...</p>
                        </div>
                      )}
                      
                      {demoStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                            <p className="text-xl font-bold text-blue-900 mb-2">📋 ขั้นตอนที่ 1: จำตำแหน่งไพ่</p>
                            <p className="text-lg text-slate-700">มีไพ่ 4 ใบ ประกอบด้วย 2 คู่ (สีแดง 2 ใบ, สีเขียวขาว 2 ใบ)</p>
                          </div>
                          
                          {/* ไพ่แสดงตัวอย่าง */}
                          <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-3xl border-2 border-blue-200">
                            {cards.slice(0, 4).map((card, idx) => (
                              <div key={card.id} className="flex flex-col items-center">
                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl shadow-md flex items-center justify-center border-4 border-white bg-gradient-to-b from-blue-400 to-blue-500 transform scale-100 animate-pulse-subtle">
                                  <span className="text-white/60 font-black text-3xl">?</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 mt-2">ไพ่ที่ {idx + 1}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {demoStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                            <p className="text-xl font-bold text-green-900 mb-2">👆 ขั้นตอนที่ 2: เปิดไพ่แรก</p>
                            <p className="text-lg text-slate-700">คลิกที่ไพ่เพื่อเปิด... พบสีแดง</p>
                          </div>
                          
                          {/* ไพ่แสดงตัวอย่าง */}
                          <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-3xl border-2 border-green-200">
                            {cards.slice(0, 4).map((card, idx) => (
                              <div key={card.id} className="flex flex-col items-center">
                                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shadow-md flex items-center justify-center border-4 border-white transform transition-all ${
                                  flippedCards.includes(card.id)
                                    ? 'bg-white ring-4 ring-green-400 animate-pulse'
                                    : 'bg-gradient-to-b from-blue-400 to-blue-500'
                                }`}
                                style={{ backgroundColor: flippedCards.includes(card.id) ? card.color : undefined }}>
                                  {flippedCards.includes(card.id) ? '' : <span className="text-white/60 font-black text-3xl">?</span>}
                                </div>
                                <p className="text-sm font-bold text-slate-600 mt-2">ไพ่ที่ {idx + 1}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-center text-lg text-green-600 font-bold animate-bounce">👈 ไพ่แรก: สีแดง</p>
                        </div>
                      )}

                      {demoStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200">
                            <p className="text-xl font-bold text-yellow-900 mb-2">🔍 ขั้นตอนที่ 3: เปิดไพ่ที่สอง</p>
                            <p className="text-lg text-slate-700">หาไพ่ที่มีสีเดียวกับไพ่แรก...</p>
                          </div>
                          
                          {/* ไพ่แสดงตัวอย่าง */}
                          <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-3xl border-2 border-yellow-200">
                            {cards.slice(0, 4).map((card, idx) => (
                              <div key={card.id} className="flex flex-col items-center">
                                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shadow-md flex items-center justify-center border-4 border-white transform transition-all ${
                                  flippedCards.includes(card.id)
                                    ? 'bg-white ring-4 ring-yellow-400 animate-pulse'
                                    : 'bg-gradient-to-b from-blue-400 to-blue-500'
                                }`}
                                style={{ backgroundColor: flippedCards.includes(card.id) ? card.color : undefined }}>
                                  {flippedCards.includes(card.id) ? '' : <span className="text-white/60 font-black text-3xl">?</span>}
                                </div>
                                <p className="text-sm font-bold text-slate-600 mt-2">ไพ่ที่ {idx + 1}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-center text-lg text-yellow-600 font-bold animate-bounce">👉 ไพ่ที่สาม: สีแดง (จับคู่ถูก!)</p>
                        </div>
                      )}

                      {demoStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200">
                            <p className="text-xl font-bold text-pink-900 mb-2">🎉 ขั้นตอนที่ 4: จับคู่สำเร็จ!</p>
                            <p className="text-lg text-slate-700">ได้ 1 คู่ แล้ว! จนบรรลุเป้าหมาย</p>
                          </div>
                          
                          <div className="text-center p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl border-4 border-pink-300">
                            <p className="text-3xl font-black text-pink-700">✨ +1 คู่ ✨</p>
                            <p className="text-lg text-pink-600 font-bold mt-2">ทำต่อไปเรื่อยๆ...</p>
                          </div>
                        </div>
                      )}

                      {demoStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border-2 border-purple-200">
                            <p className="text-xl font-bold text-purple-900 mb-2">🔄 ขั้นตอนที่ 5: จับคู่ที่สอง (เปิดไพ่แรก)</p>
                            <p className="text-lg text-slate-700">ต่อไปจับคู่อีกใบ เปิดไพ่อีกใบ...</p>
                          </div>
                          
                          {/* ไพ่แสดงตัวอย่าง */}
                          <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-3xl border-2 border-purple-200">
                            {cards.slice(0, 4).map((card, idx) => (
                              <div key={card.id} className="flex flex-col items-center">
                                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shadow-md flex items-center justify-center border-4 border-white transform transition-all ${
                                  flippedCards.includes(card.id)
                                    ? 'bg-white ring-4 ring-purple-400 animate-pulse'
                                    : 'bg-gradient-to-b from-blue-400 to-blue-500'
                                }`}
                                style={{ backgroundColor: flippedCards.includes(card.id) ? card.color : undefined }}>
                                  {flippedCards.includes(card.id) ? '' : <span className="text-white/60 font-black text-3xl">?</span>}
                                </div>
                                <p className="text-sm font-bold text-slate-600 mt-2">ไพ่ที่ {idx + 1}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-center text-lg text-purple-600 font-bold animate-bounce">👉 ไพ่ที่สอง: สีเขียวขาว</p>
                        </div>
                      )}

                      {demoStep === 6 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-2xl border-2 border-cyan-200">
                            <p className="text-xl font-bold text-cyan-900 mb-2">🎯 ขั้นตอนที่ 6: จับคู่ที่สอง (เปิดไพ่สุดท้าย)</p>
                            <p className="text-lg text-slate-700">เปิดไพ่สุดท้าย... สีเขียวขาว!</p>
                          </div>
                          
                          {/* ไพ่แสดงตัวอย่าง */}
                          <div className="flex justify-center gap-4 bg-slate-50 p-8 rounded-3xl border-2 border-cyan-200">
                            {cards.slice(0, 4).map((card, idx) => (
                              <div key={card.id} className="flex flex-col items-center">
                                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl shadow-md flex items-center justify-center border-4 border-white transform transition-all ${
                                  flippedCards.includes(card.id)
                                    ? 'bg-white ring-4 ring-cyan-400 animate-pulse'
                                    : 'bg-gradient-to-b from-blue-400 to-blue-500'
                                }`}
                                style={{ backgroundColor: flippedCards.includes(card.id) ? card.color : undefined }}>
                                  {flippedCards.includes(card.id) ? '' : <span className="text-white/60 font-black text-3xl">?</span>}
                                </div>
                                <p className="text-sm font-bold text-slate-600 mt-2">ไพ่ที่ {idx + 1}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-center text-lg text-cyan-600 font-bold animate-bounce">✅ ไพ่ที่สี่: สีเขียวขาว (จับคู่ถูก!)</p>
                        </div>
                      )}

                      {demoStep === 7 && (
                        <div className="space-y-6 animate-fade-in">
                          <div className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200">
                            <p className="text-xl font-bold text-orange-900 mb-2">🏆 ขั้นตอนที่ 7: เสร็จสิ้น!</p>
                            <p className="text-lg text-slate-700">จับคู่ไพ่ทั้งหมดแล้ว!</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl p-8 border-4 border-orange-200">
                            <div className="text-center space-y-4">
                              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">🎊 ยอดเยี่ยม! 🎊</p>
                              <div className="space-y-3 text-left max-w-md mx-auto">
                                <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                                  <span className="text-2xl">🎯</span>
                                  <p className="text-lg text-slate-700">เปิดไพ่ 2 ใบ แล้วสังเกตว่าสีเดียวกันหรือไม่</p>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                                  <span className="text-2xl">🧠</span>
                                  <p className="text-lg text-slate-700">จำตำแหน่งของสีต่างๆ ให้ดี</p>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                                  <span className="text-2xl">⚡</span>
                                  <p className="text-lg text-slate-700">ทำให้เร็ว ลดจำนวนครั้ง</p>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                                  <span className="text-2xl">🏅</span>
                                  <p className="text-lg text-slate-700">จับคู่ไพ่ได้หมดเท่านั้น = ชนะ!</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ปุ่มควบคุม */}
                    <div className="flex flex-col md:flex-row gap-4 mt-8">
                      <button 
                        onClick={closeDemo} 
                        className="flex-1 py-5 bg-gradient-to-r from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-800 font-bold text-xl rounded-2xl shadow-lg transition-all hover:scale-105 border-b-4 border-slate-400"
                      >
                        ❌ ปิดตัวอย่าง
                      </button>
                      
                      {demoStep === 7 && (
                        <button 
                          onClick={() => {
                            closeDemo()
                            setTimeout(() => setShowDemo(false), 300)
                          }}
                          className="flex-1 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xl rounded-2xl shadow-lg transition-all hover:scale-105 border-b-4 border-indigo-800 animate-pulse"
                        >
                          🚀 เข้าใจแล้ว!
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            </div>
        )}

        {/* Game Grid */}
        {!showDemo && !gameCompleted && (
            <div className="flex-1 flex flex-col items-center justify-start w-full max-w-6xl animate-fade-in-up z-10 pb-20">
            {previewing && (
                <div className="mb-6 z-20 sticky top-32 flex items-center gap-4">
                    <span className="bg-[#FDE047] text-yellow-900 px-8 py-3 rounded-full text-2xl font-black shadow-xl border-4 border-white">
                    ⏳ จำตำแหน่งไพ่! {previewTimer}
                    </span>
                    <button 
                        onClick={() => speak("จำตำแหน่งสีให้ดีนะครับ")}
                        className="text-3xl hover:scale-110 transition-all"
                    >🔊</button>
                </div>
            )}

            <div className="flex justify-center items-center w-full">
                <div className={`grid gap-3 md:gap-4 justify-items-center
                    ${difficulty === 1 
                      ? 'grid-cols-4 sm:grid-cols-5 max-w-3xl' 
                      : 'grid-cols-6 max-w-4xl'
                    }
                  `}>
                    {cards.map((card) => {
                    const isShown = card.isFlipped || card.isMatched || flippedCards.includes(card.id) || previewing;
                    
                    const matchedStyle = card.isMatched 
                        ? 'opacity-0 scale-125 rotate-12 pointer-events-none' 
                        : 'opacity-100 scale-100 hover:scale-105 active:scale-95';

                    return (
                        <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        disabled={card.isMatched || previewing}
                        className={`
                            w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
                            rounded-2xl shadow-md
                            transition-all duration-700 ease-out transform
                            ${matchedStyle}
                            ${isShown && !card.isMatched ? 'rotate-y-180 bg-white ring-4 ring-white' : ''} 
                            ${!isShown && !card.isMatched ? 'bg-gradient-to-b from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-1' : ''}
                        `}
                        style={{ perspective: '1000px' }}
                        >
                        <div className={`
                            w-full h-full rounded-xl flex items-center justify-center text-4xl font-bold 
                            ${isShown ? 'shadow-inner' : ''}
                        `}
                        style={{ backgroundColor: (isShown && !card.isMatched) ? card.color : undefined }}
                        >
                            {card.isMatched && <span className="text-5xl animate-spin">✨</span>}
                            {!isShown && !card.isMatched && <span className="text-white/40 text-3xl select-none">?</span>}
                        </div>
                        </button>
                    )
                    })}
                </div>
            </div>
            </div>
        )}

        {/* Result Screen */}
        {gameCompleted && (
            <div className="flex-1 flex items-center justify-center w-full p-4 my-auto animate-fade-in-up z-20">
                <div className="max-w-2xl w-full bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-10 text-center border-[8px] border-white/50 ring-4 ring-blue-200">
                <div className="text-9xl mb-4 animate-bounce drop-shadow-md">🎉</div>
                <h2 className="text-6xl font-black text-blue-900 mb-4 tracking-tight">เก่งมาก!</h2>
                <p className="text-2xl text-slate-500 mb-10 font-medium bg-slate-50 inline-block px-6 py-2 rounded-full">
                    {isDailyMode ? 'ภารกิจส่วนนี้เสร็จสิ้นแล้ว' : 'คุณจับคู่สีได้ครบทุกใบแล้ว'}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
                        <p className="text-blue-600 font-bold text-lg mb-1 uppercase tracking-wider">เวลาที่ใช้</p>
                        <p className="text-5xl font-black text-blue-800">{formatTime(totalTime)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100">
                        <p className="text-green-600 font-bold text-lg mb-1 uppercase tracking-wider">จำนวนครั้ง</p>
                        <p className="text-5xl font-black text-green-800">{moves}</p>
                    </div>
                </div>

                {!isDailyMode && difficulty === 1 && (
                    <button 
                        onClick={() => { setGameStarted(false); setDifficulty(2); setSelectedLevel(2); }} 
                        className="w-full py-5 mb-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xl rounded-2xl shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-red-700 active:border-b-0 active:translate-y-0"
                    >
                        ⚡ ระดับยาก
                    </button>
                )}
                
                {isDailyMode ? (
                  <button 
                    onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                    className="w-full py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-2xl font-bold rounded-2xl shadow-xl shadow-green-200 transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    ✅ ผ่านด่าน (ไปต่อ)
                  </button>
                ) : (
                  <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={() => { cancel(); setGameStarted(false); setSelectedLevel(null); }} className="flex-1 py-5 bg-gradient-to-r from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400 text-blue-900 font-bold text-xl rounded-2xl transition-all border-b-4 border-blue-400 active:border-b-0 active:translate-y-0 shadow-md">
                    กลับเมนูหลัก
                    </button>
                  </div>
                )}
                </div>
            </div>
        )}
        </>
      )}
      </div>
    </div>
  )
}