'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');

  // ✅ 2. เปิดใช้งานระบบเสียง
  const { speak } = useTTS();
  const hasSpokenWelcome = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false); // เช็คว่ากดปุ่มเริ่มเสียงยัง
  const [soundDisabled, setSoundDisabled] = useState(false); // เพิ่ม state สำหรับปิดเสียงบรรยาย (TTS)

  // ✅ เพิ่ม State สำหรับกันการบันทึกซ้ำ
  const [isSaving, setIsSaving] = useState(false);

  const [displayedWords, setDisplayedWords] = useState<VocabularyWord[]>([])
  const [selectionOptions, setSelectionOptions] = useState<VocabularyWord[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const [showWords, setShowWords] = useState(true)
  const [difficulty, setDifficulty] = useState(1)
  const [difficultyChoice, setDifficultyChoice] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [timeLimit, setTimeLimit] = useState(90)
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [displayTimer, setDisplayTimer] = useState(10)
  const [showDisplayTimer, setShowDisplayTimer] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
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
      // อธิบายกติกา แล้วค่อยอ่านคำศัพท์
      const utter = new window.SpeechSynthesisUtterance("จดจำคำศัพท์ที่เห็นให้ดี ");
      utter.lang = 'th-TH';
      utter.rate = 0.9;
      utter.onend = () => setHasExplainedRules(true);
      window.speechSynthesis.speak(utter);
    }
  }, [gameStarted, showDisplayTimer, showWords, soundDisabled, hasExplainedRules, displayedWords]);

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

  // cleanup demo timeouts
  useEffect(() => {
    return () => {
      demoTimeoutsRef.current.forEach(clearTimeout);
      demoTimeoutsRef.current = [];
    };
  }, []);

  // ------------------------------

  const initializeGame = (level: number = difficulty) => {
    setIsSaving(false); // ✅ Reset สถานะการบันทึก
    const wordCount = level === 2 ? 15 : 10;
    const words = generateVocabularyWords(level, wordCount)
    const options = generateVocabularyOptions(words, level)
    setDisplayedWords(words)
    setSelectionOptions(options)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(true)
    setGameCompleted(false)
    setTotalTime(0)
    setDifficulty(level)
    const previewSeconds = level === 1 ? 75 : 90
    const playLimit = level === 1 ? 90 : 105
    setTimeLimit(Math.min(playLimit, getTimeLimit('vocabulary', level)))
    setCorrectCount(null)
    setDisplayTimer(previewSeconds)
    setShowDisplayTimer(true)
  }

  // Auto Start Daily Mode
  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted && hasInteracted) {
        initializeGame(levelFromQuery);
    }
  }, [isDailyMode, levelFromQuery, hasInteracted, gameStarted, gameCompleted, initializeGame]);

  const startDemo = (level: number = 1) => {
    setIsSaving(false); // ✅ Reset สถานะการบันทึก
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setShowDemo(true)
    setDemoStep(0)
    speak("นี่คือตัวอย่างการเล่นครับ... ช่วงแรกให้จำคำศัพท์... พอหมดเวลา ให้เลือกคำศัพท์ที่จำได้ครับ");
    const demoWords = generateVocabularyWords(level, 6)
    const demoOptions = generateVocabularyOptions(demoWords, level)
    setDisplayedWords(demoWords)
    setSelectionOptions(demoOptions)
    setSelectedWords([])
    setShowWords(true)
    setGameStarted(false)
    setGameCompleted(false)
    setTotalTime(0)
    setCorrectCount(null)
    setDifficulty(level)

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

  // ✅ เพิ่ม useEffect สำหรับบันทึกคะแนนเมื่อจบเกม
  useEffect(() => {
    if (gameCompleted && !isSaving && correctCount !== null) {
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
  }, [gameCompleted, isSaving, correctCount]);

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
        if (prev.length >= maxSelections) return prev
        next = [...prev, word]
      }
      if (next.length >= maxSelections) {
        const correct = next.filter((w) => displayedWords.some((dw) => dw.word === w.word)).length
        setCorrectCount(correct)
        setGameCompleted(true)
      }
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
            กรุณากด <span className="font-bold text-blue-500">&quot;เริ่มใช้งานเสียง&quot;</span> ด้านล่าง<br />
            <span className="text-sm text-slate-500">(ถ้าไม่ได้ยินเสียง ให้ลองกด <span className="font-bold text-blue-400">&quot;ทดสอบเสียง&quot;</span> ก่อน)</span>
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                speak("นี่คือเสียงทดสอบภาษาไทย ถ้าคุณได้ยินเสียงนี้ แสดงว่าเบราว์เซอร์ของคุณรองรับ speech synthesis");
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl text-lg shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
              type="button"
            >
              <span className="text-2xl group-hover:animate-pulse">🔈</span>
              <span>ทดสอบเสียง</span>
            </button>
            <button
              onClick={() => {
                setHasInteracted(true);
                speak("พร้อมแล้วครับ");
              }}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-black rounded-2xl text-xl shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group border-b-4 border-green-700"
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
                    onClick={() => { closeDemo(); setTimeout(() => difficultyChoice ? initializeGame(difficultyChoice) : initializeGame(1), 300); }}
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
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-[#FFD180] rounded-[2rem] shadow-sm mb-3">
                <span className="text-7xl filter drop-shadow-sm">📚</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-[#1e3a8a] mb-2 tracking-tight drop-shadow-sm">
                เกมจำศัพท์
              </h1>
              <p className="text-xl text-slate-700 font-bold mb-1">ฝึกความจำและคำศัพท์</p>
              <p className="text-lg text-slate-500 font-medium">จำคำศัพท์และเลือกให้ถูกต้อง</p>
            </div>
            {/* ฟังคำแนะนำ + ตัวอย่างการเล่น */}
            <div className="flex justify-center gap-4 mb-8 items-center w-full">
              <button
                onClick={() => speak('เลือกความยาก แล้วกดปุ่มเริ่มเล่น เพื่อเริ่มจำคำศัพท์ครับ')}
                className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-indigo-700 bg-white/90 hover:bg-white border-indigo-200"
                type="button"
                aria-label="ฟังคำแนะนำ"
              >
                <span className="text-2xl">🔊</span>
                <span>ฟังคำแนะนำ</span>
              </button>
              <button
                onClick={() => startDemo(difficultyChoice || 1)}
                className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-[#EAB308]"
                type="button"
                title="ดูตัวอย่างการเล่น"
              >
                <span className="text-2xl">💡</span>
                <span>ตัวอย่างการเล่น</span>
              </button>
            </div>
            {/* Level Buttons */}
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center items-stretch mb-10 px-4">
              {/* ระดับธรรมดา */}
              <button
                onClick={() => {
                  setDifficultyChoice(1);
                  if (!soundDisabled) speak('ระดับธรรมดา');
                }}
                className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                  ${difficultyChoice === 1
                    ? 'border-[#60A5FA] shadow-[0_0_20px_rgba(96,165,250,0.6)] scale-105 z-20 ring-4 ring-blue-100'
                    : 'border-transparent shadow-lg hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl'
                  }`}
              >
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">😊</div>
                <h3 className={`text-3xl font-black mb-2 ${difficultyChoice === 1 ? 'text-[#2563EB]' : 'text-[#1e3a8a]'}`}>ระดับธรรมดา</h3>
                <p className="text-sm text-slate-500 font-bold">จำนวนคำศัพท์น้อย เหมาะเริ่มฝึกฝน</p>
              </button>
              {/* ระดับยาก */}
              <button
                onClick={() => {
                  setDifficultyChoice(2);
                  if (!soundDisabled) speak('ระดับยาก');
                }}
                className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                  ${difficultyChoice === 2
                    ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105 z-20 ring-4 ring-purple-100'
                    : 'border-transparent shadow-lg hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl'
                  }`}
              >
                <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">🤓</div>
                <h3 className={`text-3xl font-black mb-2 ${difficultyChoice === 2 ? 'text-[#7C3AED]' : 'text-[#581c87]'}`}>ระดับยาก</h3>
                <p className="text-sm text-slate-500 font-bold">ท้าทายความจำ จำนวนคำศัพท์เยอะขึ้น</p>
              </button>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4 relative z-20">
              {/* Start Button */}
              <button
                onClick={() => difficultyChoice && initializeGame(difficultyChoice)}
                disabled={difficultyChoice === null}
                className={`w-full py-4 rounded-2xl text-2xl font-black shadow-lg transition-all duration-200
                  ${difficultyChoice
                    ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:scale-105 hover:shadow-green-300/50 cursor-pointer border-b-4 border-green-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400'
                  }`}
              >
                เริ่มเล่น
              </button>
              

              {/* Back Button */}
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  router.push('/welcome');
                }}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold text-lg hover:from-blue-500 hover:to-blue-700 transition-all shadow-md flex items-center gap-2 border-b-4 border-blue-700"
              >
                <span>⬅</span> กลับหน้าหลัก
              </button>
            </div>
          </div>
        ) : gameStarted && !gameCompleted ? (
          <div className="w-full max-w-6xl">
            
            {/* Custom Header Bar */}
            <div className="flex items-center justify-between mb-8 bg-white/90 rounded-3xl px-10 md:px-16 py-6 shadow-md border border-blue-100 max-w-7xl w-full mx-auto">
              {/* Back button */}
              <button
                onClick={() => setGameStarted(false)}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-purple-200 text-purple-800 font-extrabold text-2xl shadow-lg border-4 border-purple-300 hover:bg-purple-300 transition-all focus:outline-none focus:ring-4 focus:ring-purple-200/60 drop-shadow-xl animate-pop-in"
                style={{ minWidth: 0 }}
                type="button"
              >
                <span className="text-2xl">&lt;</span> กลับ
              </button>
              {/* Centered level info */}
              <div className="flex-1 flex flex-col items-center">
                <span className="uppercase text-lg font-extrabold text-blue-300 tracking-widest mb-2" style={{letterSpacing:'0.12em'}}>LEVEL</span>
                <span className="text-4xl md:text-5xl font-extrabold text-blue-600 drop-shadow-sm">
                  {difficulty === 2 ? 'ระดับยาก' : 'ระดับธรรมดา'}
                </span>
              </div>
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
                  className="grid justify-center gap-x-12 gap-y-10 mx-auto"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gridAutoFlow: 'row',
                    maxWidth: '100%',
                  }}
                >
                  {displayedWords.map((word) => (
                    <div
                      key={word.id}
                      className="bg-white py-4 px-10 rounded-2xl border-2 border-primary-200 shadow flex items-center justify-center mx-auto mb-2"
                      style={{ minWidth: 160, maxWidth: 360, width: 'auto' }}
                    >
                      <p className="text-2xl font-extrabold text-primary-700 tracking-wide drop-shadow-sm text-center w-full whitespace-nowrap">{word.word}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center mb-8 bg-green-50 border-4 border-primary-200 p-10 w-full max-w-screen-xl mx-auto rounded-2xl">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
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
          <div className="w-full max-w-5xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl px-20 py-6 md:px-32 md:py-8 text-center min-w-[900px]" style={{ minWidth: 900 }}>
              <h2 className="text-4xl md:text-5xl font-extrabold text-green-700 mb-2 flex items-center justify-center gap-2">
                <span className="text-3xl md:text-4xl">🎉</span>
                <span>ยินดีด้วย!</span>
              </h2>
              <div className="flex flex-row justify-center gap-12 mb-4 w-full mx-auto">
                {/* ผลการเล่น */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-16 py-4 flex flex-col items-center shadow-sm min-w-[360px] mx-2">
                  <span className="text-3xl mb-1">📖</span>
                  <span className="text-lg font-bold text-blue-700 mb-1 leading-tight">ผลการเล่น</span>
                  <span className="text-4xl font-extrabold text-blue-900 mb-1">{correctCount !== null ? `${correctCount}/${displayedWords.length}` : `0/${displayedWords.length}`}</span>
                  <span className="text-base font-bold text-blue-700">คำ</span>
                </div>
                {/* คะแนน */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-16 py-4 flex flex-col items-center shadow-sm min-w-[360px] mx-2">
                  <span className="text-3xl mb-1">🏆</span>
                  <span className="text-lg font-bold text-blue-700 mb-1 leading-tight">คะแนนที่ได้</span>
                  <span className="text-4xl font-extrabold text-blue-900 mb-1">{correctCount ?? 0}</span>
                  <span className="text-base font-bold text-blue-700">คะแนน</span>
                </div>
              </div>
              <div className="flex justify-center mb-4">
                {/* ใช้เวลา */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-16 py-4 flex flex-col items-center shadow-sm min-w-[360px]">
                  <span className="text-3xl mb-1"><span role="img" aria-label="alarm">⏰</span></span>
                  <span className="text-lg font-bold text-yellow-700 mb-1 leading-tight">ใช้เวลา</span>
                  <span className="text-4xl font-extrabold text-orange-700 mb-1">{formatTime(totalTime)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 mt-4 w-full">
                <button
                  onClick={() => {
                    // ไปหน้าระดับยาก
                    window.location.href = '/games/vocabulary?level=hard';
                  }}
                  className="w-full max-w-sm mx-auto py-4 bg-green-500 hover:bg-green-600 text-white text-2xl font-extrabold rounded-2xl shadow-lg transition-transform hover:scale-105"
                >
                  ถัดไป(ยาก)
                </button>
                <button
                  onClick={() => {
                    setGameStarted(false);
                    setGameCompleted(false);
                    setSelectedWords([]);
                    setCorrectCount(null);
                    setTotalTime(0);
                    setShowWords(true);
                  }}
                  className="w-full max-w-sm mx-auto py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 text-2xl font-extrabold rounded-2xl shadow transition-all"
                >
                  กลับหน้าเมนู
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}