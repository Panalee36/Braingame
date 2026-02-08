'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  generateVocabularyWords,
  generateVocabularyOptions,
  getTimeLimit,
} from '@/utils/gameUtils'
import { useTTS } from '@/hooks/useTTS' // ✅ 1. เรียกใช้ Hook เสียง

// Sunset balloon background theme (คงเดิม)
const SunsetBalloonBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden" style={{background: 'linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 40%, #a5b4fc 100%)'}}>
    <div className="absolute left-1/2 -translate-x-1/2 top-10 w-56 h-56 bg-gradient-to-br from-yellow-300 via-orange-200 to-pink-200 rounded-full opacity-60 blur-2xl"></div>
    {[{left:'5%',top:'8%',color:'#fbbf24'},{left:'90%',top:'12%',color:'#f472b6'},{left:'7%',top:'80%',color:'#60a5fa'},{left:'92%',top:'78%',color:'#a3e635'},{left:'50%',top:'3%',color:'#fca5a5'},{left:'2%',top:'50%',color:'#f9fafb'},{left:'97%',top:'55%',color:'#c4b5fd'}].map((b,i)=>(
      <div key={i} className="absolute" style={{left:b.left,top:b.top}}>
        <svg width="54" height="80" viewBox="0 0 54 80" fill="none">
          <ellipse cx="27" cy="32" rx="24" ry="32" fill={b.color} fillOpacity="0.85" />
          <rect x="24" y="64" width="6" height="16" rx="3" fill="#aaa" fillOpacity="0.3" />
          <ellipse cx="27" cy="32" rx="24" ry="32" fill="url(#balloonGrad)" fillOpacity="0.18" />
          <defs>
            <radialGradient id="balloonGrad" cx="0" cy="0" r="1" gradientTransform="translate(27 32) scale(24 32)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff"/>
              <stop offset="1" stopColor="#fff" stopOpacity="0"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
    ))}
    <div className="absolute bottom-0 w-full h-auto pointer-events-none">
      <svg className="absolute w-full h-[180px] md:h-[260px] text-pink-100/60" style={{ bottom: '60px' }} viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor"><path d="M0,192 C150,120 300,150 400,180 C550,220 650,120 800,140 C950,160 1050,220 1200,200 C1350,180 1400,100 1440,120 V320 H0 Z" /></svg>
      <svg className="relative w-full h-[120px] md:h-[180px] text-blue-100 drop-shadow-md" style={{ bottom: '0px' }} viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor"><path d="M0,256 C120,200 240,160 360,192 C480,224 550,280 680,260 C800,240 880,160 1000,170 C1150,180 1250,240 1360,220 C1400,210 1420,200 1440,220 V320 H0 Z" /></svg>
    </div>
  </div>
);

interface VocabularyWord {
  id: string
  word: string
  imageUrl?: string
}

export default function VocabularyGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>}>
      <VocabularyGameContent />
    </Suspense>
  )
}

function VocabularyGameContent() {
    // ...existing code...
    // เพิ่ม state สำหรับควบคุมลำดับเสียงอธิบายกติกา
    const [hasExplainedRules, setHasExplainedRules] = useState(false);

    // ฟังก์ชันอ่านคำศัพท์ทั้งหมดทีละคำ (สำหรับ advice button)
    // อ่านคำศัพท์ advice แบบลื่นไหล (รอพูดจบทีละคำ)
    const handleSpeakAllWords = async () => {
      for (const word of displayedWords) {
        await new Promise<void>(resolve => {
          const utter = new window.SpeechSynthesisUtterance(word.word);
          utter.lang = 'th-TH';
          utter.rate = 0.7; // ช้าลงเพื่อผู้สูงอายุ
          utter.onend = () => resolve();
          window.speechSynthesis.speak(utter);
        });
      }
    };
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  // const levelFromQuery = parseInt(searchParams.get('level') || '1', 10); // ไม่ใช้ระดับอีกต่อไป
  const dailyStep = searchParams.get('dailyStep');

  // ✅ 2. เปิดใช้งานระบบเสียง
  const { speak } = useTTS();
  const hasSpokenWelcome = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false); // เช็คว่ากดปุ่มเริ่มเสียงยัง
  // ✅ อ่านค่า soundDisabled จาก localStorage ถ้าเป็น daily mode
  useEffect(() => {
    if (isDailyMode) {
      setHasInteracted(true);
      const local = localStorage.getItem('daily_quiz_sound_disabled');
      if (local === 'true') {
        setSoundDisabled(true);
      } else {
        setSoundDisabled(false);
      }
    }
  }, [isDailyMode]);
  const [soundDisabled, setSoundDisabled] = useState(false); // เพิ่ม state สำหรับปิดเสียงบรรยาย (TTS)

  const [displayedWords, setDisplayedWords] = useState<VocabularyWord[]>([])
  const [selectionOptions, setSelectionOptions] = useState<VocabularyWord[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const [showWords, setShowWords] = useState(true)
  // ไม่มีระดับอีกต่อไป
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [timeLimit, setTimeLimit] = useState(90)
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [displayTimer, setDisplayTimer] = useState(10)
  const [showDisplayTimer, setShowDisplayTimer] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const demoTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // --- 🔊 ระบบเสียงแบบ fast-math ---

  // 1. เสียงต้อนรับ
  useEffect(() => {
    if (hasInteracted && !hasSpokenWelcome.current && !gameStarted && !isDailyMode && !soundDisabled) {
      setTimeout(() => {
        speak("ยินดีต้อนรับสู่เกมจำศัพท์ครับ... วิธีเล่นคือ ให้คุณจำคำศัพท์ที่ปรากฏบนหน้าจอให้ได้ แล้วเลือกคำตอบให้ถูกต้อง... กรุณาเลือกระดับความยาก แล้วเริ่มเล่นได้เลยครับ");
        hasSpokenWelcome.current = true;
      }, 500);
    }
  }, [hasInteracted, speak, gameStarted, isDailyMode, soundDisabled]);

  // 2.1 อธิบายกติกาก่อนอ่านคำศัพท์
  useEffect(() => {
    if (gameStarted && showDisplayTimer && showWords && !soundDisabled && !hasExplainedRules && displayedWords.length > 0) {
      // อธิบายกติกา แล้วค่อยอ่านคำศัพท์ (ใช้ speak() เพื่อป้องกันซ้ำ)
      speak("จดจำคำศัพท์ที่เห็นให้ดี");
      setTimeout(() => setHasExplainedRules(true), 1200);
    }
  }, [gameStarted, showDisplayTimer, showWords, soundDisabled, hasExplainedRules, displayedWords, speak]);

  // 2.2 อ่านคำศัพท์ทีละคำหลังอธิบายกติกา
  useEffect(() => {
    if (gameStarted && showDisplayTimer && showWords && !soundDisabled && displayedWords.length > 0 && hasExplainedRules) {
      let cancelled = false;
      const speakWords = async () => {
        for (const word of displayedWords) {
          if (cancelled) break;
          await new Promise<void>(res => {
            speak(word.word);
            setTimeout(res, 1200);
          });
        }
      };
      speakWords();
      return () => { cancelled = true; };
    }
  }, [gameStarted, showDisplayTimer, showWords, soundDisabled, displayedWords, speak, hasExplainedRules]);

  // 3. เสียงเปลี่ยนเฟส (หมดเวลาจำ -> เริ่มตอบ)
  useEffect(() => {
    if (!hasInteracted || soundDisabled) return;
    if (!showDisplayTimer && gameStarted && !gameCompleted && !showWords) {
      speak("หมดเวลาดูแล้วครับ... คราวนี้ ช่วยเลือกคำศัพท์ที่คุณเห็นเมื่อกี้ ให้ครบทุกคำเลยนะครับ");
    }
  }, [showDisplayTimer, gameStarted, gameCompleted, showWords, hasInteracted, speak, soundDisabled]);

  // 4. เสียงจบเกม
  useEffect(() => {
    if (gameCompleted && hasInteracted && correctCount !== null && !soundDisabled) {
      if (correctCount === displayedWords.length) {
        speak("เยี่ยมมากครับ! คุณจำได้ถูกต้องครบทุกคำเลย");
      } else {
        speak(`เกมจบแล้วครับ คุณจำได้ ${correctCount} คำ จากทั้งหมด ${displayedWords.length} คำ... ลองพยายามใหม่อีกครั้งนะครับ`);
      }
    }
  }, [gameCompleted, hasInteracted, correctCount, displayedWords, speak, soundDisabled]);

  // ✅ เพิ่ม useEffect สำหรับบันทึกคะแนนเมื่อจบเกม (ไม่บันทึกถ้าเป็น daily mode)
  useEffect(() => {
    if (gameCompleted && !isSaving && !isDailyMode && correctCount !== null) {
      setIsSaving(true);
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch('/api/game/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            gameType: 'vocabulary',
            score: correctCount
          })
        })
        .then(res => res.json())
        .then(data => console.log('Score saved:', data))
        .catch(err => console.error('Error saving score:', err));
      }
    }
  }, [gameCompleted, isSaving, correctCount, isDailyMode]);

  // cleanup demo timeouts
  useEffect(() => {
    return () => {
      demoTimeoutsRef.current.forEach(clearTimeout);
      demoTimeoutsRef.current = [];
    };
  }, []);

  // ------------------------------

  const initializeGame = () => {
    const wordCount = 20; // กำหนดจำนวนคำตายตัว (20 คำ)
    const words = generateVocabularyWords(1, wordCount)
    const options = generateVocabularyOptions(words, 1, 30)
    setDisplayedWords(words)
    setSelectionOptions(options)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(true)
    setGameCompleted(false)
    setTotalTime(0)
    setIsSaving(false)
    setTimeLimit(120) // กำหนดเวลาตายตัว 2 นาที (120 วินาที)
    setCorrectCount(null)
    setDisplayTimer(120) // เวลาดูคำ 2 นาที (120 วินาที)
    setShowDisplayTimer(true)
  }

  // Auto Start Daily Mode
  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted && hasInteracted) {
        initializeGame();
    }
  }, [isDailyMode, hasInteracted, gameStarted, gameCompleted]);

  const startDemo = () => {
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setShowDemo(true)
    setDemoStep(0)
    speak("นี่คือตัวอย่างการเล่นครับ... ช่วงแรกให้จำคำศัพท์... พอหมดเวลา ให้เลือกคำศัพท์ที่จำได้ครับ");
    const demoWords = generateVocabularyWords(1, 6)
    const demoOptions = generateVocabularyOptions(demoWords, 1)
    setDisplayedWords(demoWords)
    setSelectionOptions(demoOptions)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(false)
    setGameCompleted(false)
    setTotalTime(0)
    setCorrectCount(null)

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      demoTimeoutsRef.current.push(id);
    };

    schedule(() => {
      setDemoStep(1); // แสดงคำให้จำ
      if (!soundDisabled) speak("จำคำศัพท์ที่เห็นให้ได้ครับ");

      schedule(() => {
        setDemoStep(2); // เตือนว่ากำลังจะซ่อน
        if (!soundDisabled) speak("อีกสักครู่จะซ่อน แล้วให้เลือกคำที่จำได้");

        schedule(() => {
          setShowWords(false);
          setDemoStep(3); // เลือกคำ
          if (!soundDisabled) speak("ตอนนี้เลือกคำศัพท์ที่จำได้จากรายการนะครับ");

          schedule(() => {
            setSelectedWords(demoWords.slice(0, 4));
            setDemoStep(4); // เผยว่าถูก
            if (!soundDisabled) speak("เลือกถูกแล้ว เห็นไหมครับ? ทำแบบนี้ไปจนครบทุกคำ");

            schedule(() => {
              setDemoStep(5); // สรุปกติกา
              if (!soundDisabled) speak("จำให้ครบ เลือกให้ตรง แล้วกดเริ่มเล่นได้เลยครับ");
            }, 4000);
          }, 5000);
        }, 5000);
      }, 4000);
    }, 2000);
  }

  const closeDemo = () => {
    setShowDemo(false)
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setDemoStep(0);
    setSelectedWords([]);
    setShowWords(true);
  }

  useEffect(() => {
    if (!gameStarted || !showDisplayTimer) return
    const timer = setInterval(() => {
      setDisplayTimer((prev: number) => {
        if (prev <= 1) {
          setShowWords(false)
          setShowDisplayTimer(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, showDisplayTimer])

  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return
    const timer = setInterval(() => { setTotalTime((prev: number) => prev + 1) }, 1000)
    return () => clearInterval(timer)
  }, [gameStarted, gameCompleted, showDisplayTimer])

  useEffect(() => {
    if (!gameStarted || gameCompleted || showDisplayTimer) return
    if (totalTime >= timeLimit) {
      const correct = selectedWords.filter((w) => displayedWords.some((dw) => dw.word === w.word)).length
      setCorrectCount(correct)
      setGameCompleted(true)
    }
  }, [totalTime, timeLimit, gameStarted, gameCompleted, showDisplayTimer, selectedWords, displayedWords])

  const handleWordClick = (word: VocabularyWord) => {
    if (!gameStarted || showWords || gameCompleted) return
    const maxSelections = displayedWords.length
    
    // เสียงอ่านคำศัพท์ที่เลือก (ถ้าต้องการ)
    // speak(word.word); 

    setSelectedWords((prev) => {
      const exists = prev.some((w) => w.id === word.id)
      let next: VocabularyWord[]
      if (exists) {
        next = prev.filter((w) => w.id !== word.id)
      } else {
        if (prev.length >= maxSelections) {
          // ถ้าเลือกครบ 20 แล้ว ให้แทนที่ตัวแรกที่เลือก (วน)
          next = [...prev.slice(1), word]
        } else {
          next = [...prev, word]
        }
      }
      // ไม่ต้อง setGameCompleted ที่นี่ ให้หมดเวลาค่อยจบเกม
      return next
    })
  }

  // --- 🔴 หน้าจอรอการกดครั้งแรก (Unlock Audio) ---
  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-blue-50 to-pink-100">
        <SunsetBalloonBackground />
        <div className="relative z-10 bg-white/95 p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-blue-200/60 backdrop-blur-md">
          <div className="flex flex-col items-center mb-4">
            <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 via-blue-300 to-pink-200 shadow-lg animate-bounce mb-2 text-5xl">🔊</span>
            <h1 className="text-3xl font-black text-blue-700 mb-2 drop-shadow">เปิดเสียงเกม</h1>
          </div>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            เพื่อประสบการณ์ที่ดีที่สุด<br />
            กรุณากด <span className="font-bold text-blue-500">&quot;เริ่มใช้งานเสียง&quot;</span> ด้านล่าง
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setHasInteracted(true);
                setSoundDisabled(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-2xl text-xl shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
              type="button"
            >
              <span className="text-2xl group-hover:animate-pulse">✅</span>
              <span>เริ่มใช้งานเสียง</span>
            </button>
            <button
              onClick={() => {
                setHasInteracted(true);
                setSoundDisabled(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-bold rounded-2xl text-xl shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group border-b-4 border-gray-500"
              type="button"
            >
              <span className="text-2xl">🚫</span>
              <span>ไม่ใช้เสียง</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading State (Daily Mode) ---
  if (isDailyMode && !gameStarted && !gameCompleted) {
    return (
        <div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse relative overflow-hidden">
            <SunsetBalloonBackground />
            <span className="relative z-10 bg-white/80 px-8 py-4 rounded-full shadow-lg">กำลังเตรียมเกมจำศัพท์...</span>
        </div>
    );
  }

  return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden">
      <SunsetBalloonBackground />
      <div className="relative z-10 w-full flex flex-col items-center p-4 md:p-8">
        {showDemo ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={closeDemo}></div>
            <div className="relative z-10 w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 md:p-12 border-8 border-white/60 ring-4 ring-blue-200 animate-fade-in overflow-hidden">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 animate-bounce-slow">
                  <span className="text-6xl">💡</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-2">ตัวอย่างการเล่น</h2>
                <p className="text-lg text-slate-600 font-medium">จำคำศัพท์ แล้วเลือกให้ตรง</p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1,2,3,4,5].map((s) => (
                  <div key={s} className={`h-2 rounded-full transition-all duration-500 ${demoStep >= s ? 'bg-blue-500 w-10' : 'bg-gray-200 w-8'}`}></div>
                ))}
              </div>

              <div className="space-y-6">
                {demoStep === 0 || demoStep === 1 ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 p-6">
                    <p className="text-xl font-bold text-blue-900 mb-3">ขั้นที่ 1: จำคำศัพท์</p>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {displayedWords.map((word) => (
                        <div key={word.id} className="bg-white py-3 px-2 rounded-xl border-2 border-blue-200 shadow text-center text-lg font-bold text-blue-800">{word.word}</div>
                      ))}
                    </div>
                    <p className="text-center text-sm text-blue-600 mt-3">อ่านตาม เสียงจะช่วยบอกทีละคำ</p>
                  </div>
                ) : null}

                {demoStep === 2 ? (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-3xl border-2 border-yellow-200 p-6 text-center">
                    <p className="text-xl font-bold text-yellow-900 mb-3">ขั้นที่ 2: เตรียมซ่อนคำ</p>
                    <p className="text-lg text-yellow-700 font-semibold">อีกสักครู่จะซ่อน แล้วให้เลือกคำที่จำได้</p>
                  </div>
                ) : null}

                {demoStep === 3 ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-6">
                    <p className="text-xl font-bold text-green-900 mb-4">ขั้นที่ 3: เลือกคำที่จำได้</p>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {selectionOptions.map((word) => {
                        const isSelected = selectedWords.some((w) => w.id === word.id)
                        return (
                          <button key={word.id} className={`py-3 px-2 rounded-xl text-lg font-bold transition-all ${isSelected ? 'bg-green-200 border-2 border-green-500 ring-2 ring-green-400 scale-105' : 'bg-white border-2 border-green-200 shadow'}`}>{word.word}</button>
                        )
                      })}
                    </div>
                    <p className="text-center text-green-700 font-semibold mt-3">ระบบเลือกอัตโนมัติให้ดูเป็นตัวอย่าง</p>
                  </div>
                ) : null}

                {demoStep === 4 ? (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200 p-6 text-center">
                    <p className="text-xl font-bold text-purple-900 mb-3">ขั้นที่ 4: ตรวจสอบ</p>
                    <p className="text-lg text-purple-700 font-semibold">เลือกถูกแล้ว! เห็นไหมครับ</p>
                  </div>
                ) : null}

                {demoStep >= 5 ? (
                  <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-3xl border-2 border-orange-200 p-6">
                    <p className="text-xl font-bold text-orange-900 mb-3">ขั้นที่ 5: สรุปกติกา</p>
                    <ul className="space-y-2 text-lg text-slate-700 font-medium list-disc list-inside">
                      <li>จำคำศัพท์ที่เห็น (มีเสียงช่วยอ่าน)</li>
                      <li>เมื่อซ่อนคำ ให้เลือกคำที่จำได้ทั้งหมด</li>
                      <li>เลือกครบแล้ว ระบบจะบอกผลทันที</li>
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button
                  onClick={closeDemo}
                  className="flex-1 py-4 bg-gradient-to-r from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-800 font-bold text-xl rounded-2xl shadow-lg transition-all hover:scale-105 border-b-4 border-slate-400"
                >
                  ❌ ปิดตัวอย่าง
                </button>
                {demoStep >= 5 && (
                  <button
                    onClick={() => { closeDemo(); setTimeout(() => initializeGame(), 300); }}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xl rounded-2xl shadow-lg transition-all hover:scale-105 border-b-4 border-indigo-800 animate-pulse"
                  >
                    🚀 เริ่มเล่นเลย!
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : !gameStarted ? (
          <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in my-auto pb-40">

            {/* Main Welcome Card */}
            <div className="text-center mb-6">
              <div className="inline-block p-6 bg-[#FFD180] rounded-[2.5rem] shadow-lg mb-4">
                <span className="text-8xl filter drop-shadow-sm">📘</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-[#1e3a8a] mb-3 tracking-tight drop-shadow-sm">
                เกมจำศัพท์
              </h1>
              <p className="text-xl text-slate-700 font-bold mb-1">ฝึกความจำและคำศัพท์</p>
              <p className="text-base text-slate-500 font-medium">จำคำศัพท์และเลือกให้ถูกต้อง</p>
            </div>
            {/* ฟังคำแนะนำ + ตัวอย่างการเล่น */}
            <div className="flex justify-center gap-4 mb-8 items-center w-full">
              <button
                onClick={() => speak('กดปุ่มเริ่มเล่น เพื่อเริ่มจำคำศัพท์ครับ')}
                className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200"
                type="button"
                aria-label="ฟังคำแนะนำ"
              >
                <span className="text-xl">🔊</span>
                <span>ฟังคำแนะนำ</span>
              </button>
              <button
                onClick={startDemo}
                className="flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-full cursor-pointer hover:scale-105 shadow-md hover:shadow-lg transition-all text-base border-2 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-yellow-400"
                type="button"
                title="ดูตัวอย่างการเล่น"
              >
                <span className="text-xl">💡</span>
                <span>ตัวอย่างการเล่น</span>
              </button>
            </div>
            {/* ไม่มีปุ่มเลือกระดับ */}
            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4 relative z-20">
              {/* Start Button */}
              <button
                onClick={initializeGame}
                className="w-full py-3.5 rounded-[2rem] text-xl font-black shadow-md transition-all duration-200 bg-gradient-to-r from-green-400 to-green-600 text-white hover:scale-105 hover:shadow-lg cursor-pointer"
              >
                เริ่มเล่น
              </button>
              {/* Back Button */}
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  router.push('/welcome');
                }}
                className="w-full py-3.5 rounded-[2rem] bg-[#3B82F6] text-white font-black text-xl hover:bg-[#2563EB] transition-all shadow-md"
              >
                หน้าเลือกเกม
              </button>
            </div>
          </div>
        ) : gameStarted && !gameCompleted ? (
          <div className="w-full max-w-6xl">
            
            {/* Custom Header Bar */}
            <div className="flex items-center justify-between mb-8 bg-white/90 rounded-3xl px-10 md:px-16 py-6 shadow-md border border-blue-100 max-w-7xl w-full mx-auto">
              {/* Back button หรือ ปุ่มภารกิจประจำวัน */}
              {isDailyMode ? (
                <div className="px-6 py-3 bg-yellow-50 text-yellow-800 rounded-2xl font-bold flex items-center gap-2 shadow border border-yellow-100">
                  <span>📅</span> ภารกิจประจำวัน
                </div>
              ) : (
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setGameStarted(false);
                  }}
                  className="px-6 py-3 rounded-full bg-purple-200 text-purple-800 font-extrabold text-xl shadow-lg border-2 border-purple-300 hover:bg-purple-300 transition-all focus:outline-none hover:scale-105 active:scale-95 flex items-center gap-3"
                  style={{ minWidth: 0 }}
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>เลิกเล่น</span>
                </button>
              )}
              {/* ไม่มีแถบแสดงระดับ */}
              <div className="flex-1 flex flex-col items-center" />
              {/* Speaker icon for reading all words */}
              {showWords && (
                <button
                  onClick={handleSpeakAllWords}
                  className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 hover:from-blue-300 hover:to-blue-200 text-blue-800 font-extrabold text-2xl shadow-lg border-4 border-blue-300 ml-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300/60 drop-shadow-xl animate-pop-in"
                  style={{ minWidth: 0 }}
                  title="ฟังคำศัพท์ทั้งหมด"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" strokeWidth={2.2} stroke="currentColor" className="w-10 h-10 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8h6l7 7V5l-7 7h-6z" />
                  </svg>
                  <span className="font-extrabold tracking-wide" style={{fontSize:'1.35rem'}}>ฟังคำศัพท์</span>
                </button>
              )}
            </div>

            {/* In-game UI */}
            {showDisplayTimer && (
              <div className="card text-center mb-4 bg-warning-100 border border-warning-300 rounded-xl shadow-sm animate-bounce-gentle px-3 py-3 max-w-xs mx-auto">
                <p className="text-lg font-bold text-warning-700 mb-1">จำคำศัพท์เหล่านี้ด้วย!</p>
                <p className="text-2xl font-extrabold text-warning-600">{formatTime(displayTimer)}</p>
              </div>
            )}
            {!showDisplayTimer && (
              <div className="sticky top-4 z-40 w-full max-w-4xl mb-8 mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
                    <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">เวลาที่เหลือ</p>
                    <p className="text-6xl font-black text-blue-600 tabular-nums">{formatTime(Math.max(timeLimit - totalTime, 0))}</p>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white">
                    <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-3">จำได้แล้ว</p>
                    <p className="text-6xl font-black text-cyan-600 tabular-nums">{selectedWords.length}/{displayedWords.length}</p>
                  </div>
                </div>
              </div>
            )}
            {showWords ? (
              <div className="card text-center mb-8 bg-blue-50 border-4 border-primary-500 p-10 w-full max-w-6xl mx-auto rounded-2xl shadow-lg">
                <div
                  className="grid justify-center gap-x-12 gap-y-11"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gridAutoFlow: 'row',
                    maxWidth: '100%',
                  }}
                >
                  {displayedWords.map((word) => (
                    <div
                      key={word.id}
                      className="bg-white py-4 px-8 rounded-2xl border-2 border-primary-200 shadow flex items-center justify-center mx-auto mb-2"
                      style={{ minWidth: 160, maxWidth: 360, width: 'auto', minHeight: 56, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <p className="text-2xl font-extrabold text-primary-700 tracking-wide drop-shadow-sm text-center w-full" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal'}}>{word.word}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center mb-2 bg-green-50 border-6 border-primary-200 p-10 w-full max-w-screen-xl mx-auto rounded-2xl">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-10">
                  {selectionOptions.map((word) => {
                    const isSelected = selectedWords.some((w) => w.id === word.id)
                    return (
                      <button key={word.id} onClick={() => handleWordClick(word)} className={`p-3 text-xl font-bold rounded-2xl transition-all ${isSelected ? 'btn-success' : 'bg-white border-2 border-primary-200 shadow-lg hover:scale-105'}`}>{word.word}</button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : gameCompleted ? (
          <div className="w-full max-w-3xl mx-auto">
            <div className="card text-center bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 md:p-12">
              <h2 className="text-5xl md:text-6xl font-extrabold text-green-600 mb-8 flex items-center justify-center gap-3">
                <span className="text-4xl md:text-5xl">🎉</span>
                <span>ยินดีด้วย!</span>
              </h2>
              <div className="mb-12 w-full max-w-3xl mx-auto items-stretch">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* ผลการเล่น */}
                  <div className="bg-gradient-to-br from-blue-200 via-blue-50 to-white rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl border-2 border-blue-200 min-w-[230px] min-h-[190px] transition-all duration-200 hover:scale-105">
                    <span className="text-4xl mb-2">📖</span>
                    <p className="text-2xl font-extrabold text-blue-700 mb-2 tracking-wide drop-shadow">ผลการเล่น</p>
                    <p className="text-7xl font-extrabold text-blue-900 drop-shadow-lg mb-1">{correctCount !== null ? `${correctCount}/${displayedWords.length}` : `0/${displayedWords.length}`}</p>
                    <span className="text-2xl font-bold text-blue-500">คำ</span>
                  </div>
                  {/* คะแนน */}
                  <div className="bg-gradient-to-br from-white via-blue-100 to-blue-200 rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl border-2 border-blue-300 min-w-[230px] min-h-[190px] transition-all duration-200 hover:scale-105">
                    <span className="text-4xl mb-2">🏆</span>
                    <span className="text-2xl font-extrabold text-blue-700 mb-2 tracking-wide drop-shadow">คะแนนที่ได้</span>
                    <span className="text-7xl font-extrabold text-blue-700 drop-shadow-lg">{correctCount ?? 0}</span>
                    <span className="text-2xl font-bold text-blue-500 mt-1">คะแนน</span>
                  </div>
                </div>

              </div>
              {isDailyMode ? (
                <button 
                  onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                  className="w-full py-5 bg-green-500 hover:bg-green-600 text-white text-3xl font-extrabold rounded-2xl shadow-lg transition-transform hover:scale-105 mt-2"
                >
                  ✅ ผ่านด่าน (ไปต่อ)
                </button>
              ) : (
                <div className="flex gap-4 flex-col md:flex-row mt-2">
                  <button
                    onClick={() => {
                      setGameStarted(false);
                      setGameCompleted(false);
                      setSelectedWords([]);
                      setCorrectCount(null);
                      setTotalTime(0);
                      setShowWords(true);
                    }}
                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white text-3xl font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-2 border-blue-400"
                    style={{
                      textShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                      boxShadow: '0 8px 24px 0 rgba(59, 130, 246, 0.3), 0 2px 8px 0 rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    กลับหน้าเมนู
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}