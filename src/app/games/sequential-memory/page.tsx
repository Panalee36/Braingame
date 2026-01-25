'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateSequentialImages, saveGameHistory } from '@/utils/gameUtils'
import { useTTS } from '@/hooks/useTTS' // ✅ 1. เพิ่มบรรทัดนี้

// Hook สำหรับ fallback รูปภาพ (คงเดิม)
function useImageFallback(count: number) {
  const [broken, setBroken] = useState<boolean[]>(Array(count).fill(false));
  const setBrokenAt = (idx: number) => setBroken(b => {
    const copy = [...b]; copy[idx] = true; return copy;
  });
  return [broken, setBrokenAt] as const;
}

// Winter snow background theme (คงเดิม)
const WinterSnowBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden" style={{background: 'linear-gradient(180deg, #e0f7fa 0%, #b3e0fc 60%, #e3f0ff 100%)'}}>
    {[12,24,36,48,60,72,84,96,15,30,45,55,65,80,90,10,20,35,50,70,85,95,25,40,60,75,88,99,5,100].map((left, i) => (
      <div key={i} className="absolute" style={{left: `${left}%`, top: `${(i*3)%100}%`, fontSize: `${14 + (i%6)*3}px`, opacity: 0.5 + ((i%5)*0.1), filter: 'blur(0.5px)'}}>❄️</div>
    ))}
    <div className="absolute bottom-0 w-full h-auto pointer-events-none">
      <svg className="absolute w-full h-[180px] md:h-[260px] text-blue-100/60" style={{ bottom: '60px' }} viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,192 C150,120 300,150 400,180 C550,220 650,120 800,140 C950,160 1050,220 1200,200 C1350,180 1400,100 1440,120 V320 H0 Z" />
      </svg>
      <svg className="relative w-full h-[120px] md:h-[180px] text-blue-200 drop-shadow-md" style={{ bottom: '0px' }} viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,256 C120,200 240,160 360,192 C480,224 550,280 680,260 C800,240 880,160 1000,170 C1150,180 1250,240 1360,220 C1400,210 1420,200 1440,220 V320 H0 Z" />
      </svg>
    </div>
  </div>
);

interface SequentialImageItem {
  id: string
  imageUrl: string
  label: string
  order: number
}


export default function SequentialMemoryGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');

  // ✅ 2. แทรก Hook เสียงตรงนี้ (ไม่กระทบ Logic เกม)
  const { speak, cancel } = useTTS();
  const [hasInteracted, setHasInteracted] = useState(false); // ปุ่มปลดล็อกเสียง
  const hasSpokenWelcome = useRef(false);
  // เพิ่ม state สำหรับปิดเสียงบรรยาย (TTS)
  const [soundDisabled, setSoundDisabled] = useState(false);

  // ✅ เพิ่ม State สำหรับกันการบันทึกซ้ำ
  const [isSaving, setIsSaving] = useState(false);

  // State เดิมของคุณ (คงเดิม 100%)
  const [images, setImages] = useState<SequentialImageItem[]>([]);
  const [broken, setBrokenAt] = useImageFallback(images.length);
  const [showImages, setShowImages] = useState(true);
  const [shuffledImages, setShuffledImages] = useState<SequentialImageItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(SequentialImageItem | null)[]>([]);
  const [score, setScore] = useState(0);
  
  const [difficulty, setDifficulty] = useState(levelFromQuery);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [displayTimer, setDisplayTimer] = useState(15);
  const [showDisplayTimer, setShowDisplayTimer] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const demoTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [demoImages, setDemoImages] = useState<SequentialImageItem[]>([]);
  const [demoShowImages, setDemoShowImages] = useState(true);
  const [demoShuffled, setDemoShuffled] = useState<SequentialImageItem[]>([]);
  const [demoSelected, setDemoSelected] = useState<(SequentialImageItem | null)[]>([]);

  // -------------------------------------------------------------
  // ✅ 3. เพิ่ม Logic นักพากย์ (Narrator) แบบซ่อนตัวทำงานเงียบๆ
  // -------------------------------------------------------------


  // พูดต้อนรับ
  useEffect(() => {
    if (hasInteracted && !hasSpokenWelcome.current && !gameStarted && !isDailyMode && !soundDisabled) {
       setTimeout(() => {
         speak("ยินดีต้อนรับสู่เกมจำลำดับภาพครับ... กติกาคือ ให้จำลำดับของภาพ... แล้วเรียงให้ถูกต้องนะครับ... เลือกความยากเพื่อเริ่มได้เลย");
         hasSpokenWelcome.current = true;
       }, 2000);
    }
  }, [hasInteracted, gameStarted, isDailyMode, speak, soundDisabled]);

  // พูดเมื่อเริ่มจำภาพ (Phase 1)
  useEffect(() => {
    if (gameStarted && showDisplayTimer && displayTimer === 15 && !soundDisabled) {
        speak("จำลำดับของภาพเหล่านี้ให้ดีนะครับ... เริ่มจำได้เลยครับ");
    }
  }, [gameStarted, showDisplayTimer, displayTimer, speak, soundDisabled]);

  // พูดเมื่อเริ่มตอบ (Phase 2)
  useEffect(() => {
    if (gameStarted && !showDisplayTimer && !showImages && !gameCompleted && timeElapsed === 0 && !soundDisabled) {
        speak("หมดเวลาจำแล้วครับ... ให้เรียงรูปภาพด้านล่าง... ตามลำดับที่จำได้เมื่อกี้เลยนะครับ");
    }
  }, [gameStarted, showDisplayTimer, showImages, gameCompleted, timeElapsed, speak, soundDisabled]);

  // พูดจบเกม
  useEffect(() => {
    if (gameCompleted && !soundDisabled) {
        if (score === images.length) {
            speak("เก่งมากๆ ครับ! คุณเรียงลำดับได้ถูกต้องทั้งหมดเลย");
        } else {
            speak(`จบเกมแล้วครับ... คุณเรียงถูก ${score} ภาพ... ลองใหม่นะครับ`);
        }
    }
  }, [gameCompleted, score, images.length, speak, soundDisabled]);

  // -------------------------------------------------------------

  // ฟังก์ชันเดิมของคุณ (คงเดิม)
  function handleRemoveFromSlot(idx: number) {
    setSelectedOrder(prev => {
      const copy = [...prev];
      copy[idx] = null;
      return copy;
    });
  }

  function handleImageClick(image: SequentialImageItem) {
    const isAlreadySelected = selectedOrder.some(item => item && item.id === image.id);
    if (isAlreadySelected) return;

    const emptyIdx = selectedOrder.findIndex(item => item === null);
    if (emptyIdx !== -1) {
      setSelectedOrder(prev => {
        const copy = [...prev];
        copy[emptyIdx] = image;
        return copy;
      });
    }
  }

  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        const timer = setTimeout(() => {
            initializeGame(levelFromQuery);
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [isDailyMode, levelFromQuery]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (showDisplayTimer) {
      timer = setInterval(() => {
        setDisplayTimer(prev => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            setShowDisplayTimer(false);
            setShowImages(false);
            setShuffledImages(shuffleArray(images));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [showDisplayTimer, images]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!showDisplayTimer && gameStarted && !gameCompleted && !showImages) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [showDisplayTimer, gameStarted, gameCompleted, showImages]);

  // ✅ เพิ่ม useEffect สำหรับบันทึกคะแนนเมื่อจบเกม
  useEffect(() => {
    if (gameCompleted && !isSaving) {
      setIsSaving(true);
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch('/api/game/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            gameType: 'sequential-memory',
            score: score
          })
        })
        .then(res => res.json())
        .then(data => console.log('Score saved:', data))
        .catch(err => console.error('Error saving score:', err));
      }
    }
  }, [gameCompleted, isSaving, score]);

  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const initializeGame = (levelOverride?: number) => {
    cancel(); // หยุดเสียงเก่าก่อนเริ่มใหม่
    setIsSaving(false); // ✅ Reset สถานะการบันทึก
    const levelToUse = levelOverride || difficulty;
    setDifficulty(levelToUse);
    const imageCount = levelToUse === 2 ? 9 : 6;
    const newImagesRaw = generateSequentialImages(levelToUse, imageCount);
    const newImages: SequentialImageItem[] = newImagesRaw.map(img => ({
      id: img.id, imageUrl: img.imageUrl ?? '', label: img.label ?? '', order: img.order ?? 0,
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

  // Demo flow (guided example)
  const closeDemo = () => {
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setShowDemo(false);
    setDemoStep(0);
    setDemoImages([]);
    setDemoShowImages(true);
    setDemoShuffled([]);
    setDemoSelected([]);
  };

  const startDemo = () => {
    cancel();
    setShowDemo(true);
    setDemoStep(0);
    setGameStarted(false);
    setGameCompleted(false);
    setScore(0);
    setSelectedOrder([]);
    setShowImages(true);
    setShowDisplayTimer(false);
    const sample: SequentialImageItem[] = [
      { id: 'd1', imageUrl: '', label: '🐶', order: 0 },
      { id: 'd2', imageUrl: '', label: '🐱', order: 1 },
      { id: 'd3', imageUrl: '', label: '🐰', order: 2 },
    ];
    setDemoImages(sample);
    setDemoSelected(Array(sample.length).fill(null));
    setDemoShowImages(true);
    setDemoShuffled([]);

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      demoTimeoutsRef.current.push(id);
    };

    // Step 1: show images to memorize
    schedule(() => {
      setDemoStep(1);
      if (!soundDisabled) speak('ตัวอย่างการเล่น... จดจำลำดับรูปภาพนะครับ');

      // Step 2: hide and shuffle
      schedule(() => {
        setDemoStep(2);
        setDemoShowImages(false);
        setDemoShuffled(shuffleArray(sample));
        if (!soundDisabled) speak('ครบเวลาแล้ว ซ่อนภาพไว้ แล้วเรียงลำดับให้ถูกต้อง');

        // Step 3: choose first/second/third automatically
        schedule(() => {
          setDemoStep(3);
          setDemoSelected([sample[0], null, null]);
          if (!soundDisabled) speak('วางภาพตัวแรกในลำดับที่ 1');

          schedule(() => {
            setDemoSelected([sample[0], sample[1], null]);
            if (!soundDisabled) speak('ต่อด้วยภาพตัวที่สอง');

            schedule(() => {
              setDemoSelected(sample);
              setDemoStep(4);
              if (!soundDisabled) speak('ครบแล้ว ตรวจสอบเรียบร้อย เยี่ยมมาก');

              schedule(() => {
                setDemoStep(5);
                if (!soundDisabled) speak('เล่นตามขั้นตอนนี้ได้เลย จำลำดับ แล้วเรียงให้ถูก');
              }, 4000);
            }, 4000);
          }, 4000);
        }, 4000);
      }, 5000);
    }, 1500);
  };

  const handleCheckAnswer = () => {
    if (selectedOrder.filter(Boolean).length !== images.length) {
      if (!soundDisabled) speak("กรุณาเลือกรูปภาพให้ครบทุกช่องก่อนส่งคำตอบนะครับ");
      // alert('กรุณาเลือกให้ครบทุกลำดับก่อนส่งคำตอบ');
      return;
    }
    const correctCount = selectedOrder.filter(
      (img, idx) => img && img.id === images[idx].id
    ).length;
    setScore(correctCount);
    setGameCompleted(true);
  };

  const total = images.length;
  const score100 = useMemo(() => (total > 0 ? Math.round((score / total) * 100) : 0), [score, total]);

  useEffect(() => {
    if (!gameCompleted) return;
    const username = localStorage.getItem('profile_username');
    if (username) {
      saveGameHistory(`sequential-memory_${username}`, score100);
    }
  }, [gameCompleted, score100]);

  // Cleanup demo timeouts
  useEffect(() => {
    return () => {
      demoTimeoutsRef.current.forEach(clearTimeout);
      demoTimeoutsRef.current = [];
    };
  }, []);

  // ✅ 4. หน้าจอปลดล็อกเสียง (จำเป็นต้องใส่ไว้ข้างหน้า แต่พอผ่านแล้วจะโชว์ UI เดิมของคุณ)
  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4 relative overflow-hidden">
        <WinterSnowBackground />
        <div className="relative z-10 bg-white/95 p-10 rounded-[2rem] shadow-2xl text-center max-w-md animate-pop-in border-4 border-white">
          <div className="text-7xl mb-4 animate-bounce">🗣️</div>
          <h1 className="text-3xl font-black text-slate-800 mb-4">เลือกโหมดเสียงบรรยาย</h1>
          <p className="text-slate-600 mb-8 text-lg font-medium">
              เลือกโหมดที่ต้องการเพื่อเริ่มเล่นได้เลยครับ
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <button
              onClick={() => {
                setSoundDisabled(false);
                setHasInteracted(true);
              }}
              className="w-full py-4 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 border-b-4 border-green-700"
              style={{ outline: 'none' }}
            >
              <span className="text-2xl">✅</span>
              <span>เริ่มใช้งานเสียง</span>
            </button>
            <button
              onClick={() => {
                setSoundDisabled(true);
                setHasInteracted(true);
                cancel(); // ปิดเสียงบรรยายทันที
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

  // UI เดิมสำหรับ Daily Mode
  if (isDailyMode && !gameStarted && !gameCompleted) {
      return (
        <div className="relative min-h-screen w-full flex items-center justify-center">
            <WinterSnowBackground />
            <div className="relative z-10 bg-white/80 px-8 py-4 rounded-full shadow-lg text-blue-600 font-bold animate-pulse text-xl">
                กำลังเตรียมเกม...
            </div>
        </div>
      );
  }

  // --- UI หลัก (เหมือนเดิมเป๊ะ) ---
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden">
      <WinterSnowBackground />
      <div className="relative z-10 w-full flex flex-col items-center p-4 md:p-8">

        {/* Demo Overlay */}
        {showDemo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={closeDemo}></div>
            <div className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-[3rem] shadow-2xl p-8 md:p-12 border-8 border-white/60 ring-4 ring-blue-200 animate-fade-in overflow-hidden">
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4 animate-bounce-slow">
                  <span className="text-6xl">💡</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-blue-900 mb-2">ตัวอย่างการเล่น</h2>
                <p className="text-lg text-slate-600 font-medium">จำลำดับรูปภาพ แล้วเรียงให้ถูกต้อง</p>
              </div>

              {/* Step indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {[1,2,3,4,5].map((s) => (
                  <div key={s} className={`h-2 rounded-full transition-all duration-500 ${demoStep >= s ? 'bg-blue-500 w-10' : 'bg-gray-200 w-8'}`}></div>
                ))}
              </div>

              {/* Demo content */}
              <div className="space-y-6">
                {demoStep <= 1 && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl border-2 border-blue-200 p-6">
                    <p className="text-xl font-bold text-blue-900 mb-3">ขั้นที่ 1: จำลำดับ</p>
                    <div className="grid grid-cols-3 gap-4">
                      {demoImages.map((img) => (
                        <div key={img.id} className="relative aspect-square rounded-2xl bg-white border-4 border-blue-300 shadow">
                          <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg">{img.order + 1}</div>
                          <div className="w-full h-full flex items-center justify-center text-6xl">{img.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {demoStep === 2 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-3xl border-2 border-yellow-200 p-6 text-center">
                    <p className="text-xl font-bold text-yellow-900 mb-4">ขั้นที่ 2: ซ่อนภาพ แล้วย้ายตำแหน่ง</p>
                    <div className="flex justify-center gap-3">
                      {demoShuffled.map((img, idx) => (
                        <div key={img.id} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white shadow border-2 border-yellow-200 flex items-center justify-center text-4xl">
                          <span className="text-gray-300">?</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-lg text-yellow-700 font-semibold mt-3">เตรียมลากไปวางให้ถูกลำดับ</p>
                  </div>
                )}

                {demoStep === 3 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-6">
                    <p className="text-xl font-bold text-green-900 mb-4">ขั้นที่ 3: วางทีละใบ</p>
                    <div className="flex flex-wrap gap-4 justify-center mb-4">
                      {demoSelected.map((img, idx) => (
                        <div key={idx} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-green-300 bg-white shadow flex items-center justify-center text-5xl">
                          {img ? img.label : <span className="text-gray-300 font-bold text-3xl">{idx+1}</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-lg text-green-700 font-semibold">ระบบเดโมกำลังวางภาพให้ดู</p>
                  </div>
                )}

                {demoStep === 4 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl border-2 border-purple-200 p-6 text-center">
                    <p className="text-xl font-bold text-purple-900 mb-3">ขั้นที่ 4: ตรวจสอบลำดับ</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {demoSelected.map((img, idx) => (
                        <div key={idx} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-purple-300 bg-white shadow flex items-center justify-center text-5xl">
                          {img ? img.label : <span className="text-gray-300 font-bold text-3xl">{idx+1}</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-lg text-purple-700 font-semibold mt-3">ถูกต้องครบทุกใบ!</p>
                  </div>
                )}

                {demoStep >= 5 && (
                  <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-3xl border-2 border-orange-200 p-6">
                    <p className="text-xl font-bold text-orange-900 mb-3">สรุปกติกา</p>
                    <ul className="space-y-2 text-lg text-slate-700 font-medium list-disc list-inside">
                      <li>จำลำดับรูปภาพ</li>
                      <li>เมื่อซ่อนภาพ ให้ลากภาพไปวางตามลำดับ</li>
                      <li>เรียงครบทุกใบแล้วกดส่งคำตอบ</li>
                    </ul>
                  </div>
                )}
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
        )}
        
        {/* --- Welcome Screen --- */}
        {(!gameStarted) ? (
          <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in my-auto pb-40">

            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-[#FFD180] rounded-[2rem] shadow-sm mb-3">
                <span className="text-7xl filter drop-shadow-sm">🖼️</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-[#1e3a8a] mb-2 tracking-tight drop-shadow-sm">
                เกมจำลำดับภาพ
              </h1>
              <p className="text-xl text-slate-700 font-bold mb-1">ฝึกความจำและลำดับ</p>
              <p className="text-lg text-slate-500 font-medium">จำลำดับรูปภาพ แล้วเรียงให้ถูกต้อง</p>
            </div>

            {/* ปุ่มฟังคำแนะนำ + ตัวอย่างการเล่น */}
            <div className="flex flex-row justify-center mb-6 gap-4 items-center w-full">
              <button 
                onClick={() => speak('เลือกระดับเกม แล้วกดปุ่มเริ่มเล่นเพื่อเริ่มเกมครับ')}
                className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-indigo-700 bg-white/90 hover:bg-white border-indigo-200"
                type="button"
              >
                <span className="text-2xl">🔊</span>
                <span>ฟังคำแนะนำ</span>
              </button>
              <button
                onClick={startDemo}
                className="flex items-center justify-center gap-2 font-bold px-8 h-16 rounded-full min-w-[240px] cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl transition-all text-lg border-b-4 text-yellow-900 bg-[#FDE047] hover:bg-yellow-300 border-[#EAB308]"
                type="button"
              >
                <span className="text-2xl">💡</span>
                <span>ตัวอย่างการเล่น</span>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center items-stretch mb-10 px-4">
              <button
                onClick={() => {
                  setDifficulty(1);
                  if (!soundDisabled) speak("เลือกระดับธรรมดา จำนวนรูปน้อย เหมาะเริ่มฝึกฝน");
                }}
                className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                  ${difficulty === 1
                    ? 'border-[#60A5FA] shadow-[0_0_20px_rgba(96,165,250,0.6)] scale-105 z-20 ring-4 ring-blue-100'
                    : 'border-transparent shadow-lg hover:border-blue-200 hover:-translate-y-1 hover:shadow-xl'
                  }`}
              >
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">😊</div>
                <h3 className={`text-3xl font-black mb-2 ${difficulty === 1 ? 'text-[#2563EB]' : 'text-[#1e3a8a]'}`}>ระดับธรรมดา</h3>
                <p className="text-sm text-slate-500 font-bold">จำนวนรูปน้อย เริ่มต้นฝึกฝน</p>
              </button>

              <button
                onClick={() => {
                  setDifficulty(2);
                  if (!soundDisabled) speak("เลือกระดับยาก ท้าทายความจำ จำนวนรูปเยอะขึ้น");
                }}
                className={`flex-1 group relative bg-white rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center border-4
                  ${difficulty === 2
                    ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105 z-20 ring-4 ring-purple-100'
                    : 'border-transparent shadow-lg hover:border-purple-200 hover:-translate-y-1 hover:shadow-xl'
                  }`}
              >
                <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-6xl mb-4 shadow-inner">🤓</div>
                <h3 className={`text-3xl font-black mb-2 ${difficulty === 2 ? 'text-[#7C3AED]' : 'text-[#581c87]'}`}>ระดับยาก</h3>
                <p className="text-sm text-slate-500 font-bold">ท้าทายความจำ จำนวนรูปเยอะขึ้น</p>
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4 relative z-20">
              {/* ปุ่มเริ่มเล่น */}
              <button
                onClick={() => { if (!soundDisabled) speak("เริ่มเกมครับ"); initializeGame(); }}
                disabled={!difficulty}
                className={`w-full py-4 rounded-2xl text-2xl font-black shadow-lg transition-all duration-200
                  ${difficulty
                    ? 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white hover:scale-105 hover:shadow-purple-300/50 cursor-pointer border-b-4 border-[#7E22CE]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400'
                  }`}
              >
                เริ่มเล่น
              </button>

              {!isDailyMode && (
                <button
                  onClick={() => {
                    cancel();
                    setTimeout(() => router.push('/welcome'), 100);
                  }}
                  className="px-8 py-3 rounded-2xl bg-[#3B82F6] text-white font-bold text-lg hover:bg-[#2563EB] transition-all shadow-md flex items-center gap-2 border-b-4 border-[#1D4ED8]"
                >
                  <span></span> กลับหน้าหลัก
                </button>
              )}
            </div>
          </div>
        ) : gameCompleted ? (
          <div className="w-full max-w-3xl mx-auto text-center py-14 px-4 card bg-white animate-fade-in rounded-[2.5rem] shadow-2xl my-auto flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center mb-8">
              <h2 className="text-5xl md:text-6xl font-extrabold text-green-700 mb-2 flex items-center gap-3 drop-shadow-lg">🎉 <span>ยินดีด้วย!</span></h2>
              <p className="text-2xl md:text-3xl text-blue-700 font-bold mb-4 drop-shadow">คุณจำลำดับได้สำเร็จ!</p>
              <div className="flex flex-col items-center w-full max-w-2xl mb-6 mt-2 gap-4">
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                  {/* คะแนน 100 เต็ม */}
                  <div className="flex flex-col items-center justify-between bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl p-7 shadow-lg border border-blue-200 min-w-[320px] min-h-[200px] max-w-[380px] max-h-[240px] mx-auto h-full overflow-hidden">
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-5xl mb-1">🏆</span>
                      <span className="text-2xl font-bold text-blue-700 mb-1">คะแนนที่ได้</span>
                    </div>
                    <div className="flex flex-row items-end justify-center mb-2 gap-2">
                      <span className="text-6xl font-extrabold text-green-700 drop-shadow-lg leading-none">{score100}</span>
                      <span className="text-4xl font-bold text-blue-700 leading-none">/ 100</span>
                    </div>
                  </div>
                  {/* จำนวนที่ตอบถูก */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 rounded-3xl p-7 shadow-lg border border-green-200 min-w-[320px] min-h-[200px] max-w-[380px] max-h-[240px] mx-auto h-full overflow-hidden">
                    <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
                      <span className="text-5xl mb-1">✅</span>
                      <span className="text-2xl font-bold text-green-700 mb-1">ตอบถูก</span>
                      <div className="flex flex-row items-end justify-center mt-2 gap-2">
                        <span className="text-6xl font-extrabold text-green-700 drop-shadow-lg leading-none">{score}</span>
                        <span className="text-4xl font-bold text-green-600 leading-none">/ {images.length} รูป</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* เวลา */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100 rounded-3xl p-7 shadow-lg border border-yellow-200 min-w-[320px] min-h-[200px] max-w-[380px] max-h-[240px] mx-auto h-full overflow-hidden">
                  <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
                    <span className="text-5xl mb-1">⏰</span>
                    <span className="text-2xl font-bold text-yellow-700 mb-1">ใช้เวลา</span>
                    <span className="text-6xl font-extrabold text-orange-500 drop-shadow-lg leading-none mt-2">{timeElapsed}</span>
                    <span className="text-xl font-bold text-yellow-700 leading-none">วินาที</span>
                  </div>
                </div>
              </div>
            </div>
            {isDailyMode ? (
              <div className="flex justify-center mb-4">
                  <button 
                  onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                  className="w-full max-w-md py-4 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  ✅ ผ่านด่าน (ไปต่อ)
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4 justify-center mb-2">
                {difficulty === 1 && (
                  <button 
                    onClick={() => { setDifficulty(2); setTimeout(() => initializeGame(2), 100); }} 
                    className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-2xl hover:bg-green-600 shadow-lg transition-all"
                  >
                    ถัดไป (ยาก)
                  </button>
                )}
              </div>
            )}
            {!isDailyMode && (
                <button
                  onClick={() => { setGameStarted(false); setGameCompleted(false); setScore(0); setSelectedOrder([]); setTimeElapsed(0); }}
                  className="mt-6 px-10 py-5 rounded-2xl bg-blue-100 text-blue-700 font-bold text-2xl hover:bg-blue-200 transition-all shadow-lg border border-blue-200"
                >
                    กลับเมนูหลัก
                </button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-5xl mx-auto my-auto">
            {/* Header Bar */}
            <div className="w-full max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-r from-white via-[#f8faff] to-white shadow-xl px-10 py-5 mt-4 mb-6 flex items-center justify-between border border-blue-100">
              {isDailyMode ? (
                  <div className="px-5 py-2 bg-yellow-100/80 text-yellow-800 rounded-xl font-bold flex items-center gap-2"><span>📅</span> ภารกิจประจำวัน</div>
              ) : (
                <button
                  onClick={() => {
                    cancel();
                    setGameStarted(false); setDifficulty(1); setSelectedOrder([]); setScore(0); setGameCompleted(false);
                  }}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-purple-300 text-purple-800 font-bold text-xl shadow hover:bg-purple-400 transition-all border-2 border-purple-200"
                  style={{ minWidth: 110 }}
                >
                  <span className="text-lg">❮</span> กลับ
                </button>
              )}
              
              <div className="flex-1 flex flex-col items-end">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1 pr-1">LEVEL</span>
                <span className="text-3xl font-extrabold text-blue-700 drop-shadow-sm">{difficulty === 1 ? 'ระดับธรรมดา' : 'ระดับยาก'}</span>
              </div>
            </div>

            {/* Stats Bar */}
            {!showDisplayTimer && (
              <>
                {!showImages && (
                  <div className="w-full flex flex-col items-center gap-3 mb-4">
                    <div className="inline-block bg-blue-50 rounded-full px-8 py-3 text-blue-700 font-extrabold text-2xl shadow-lg border-2 border-blue-300" style={{letterSpacing: '0.5px'}}>
                      <span role="img" aria-label="point-down" style={{fontSize: '2rem', verticalAlign: 'middle'}}>👇</span> <span style={{fontSize: '2rem'}}>เลือกรูปภาพด้านล่างตามลำดับที่จำได้</span>
                    </div>
                    {/* ปุ่มฟังซ้ำช่วงตอบ */}
                    <button
                      onClick={() => speak(' ให้เรียงรูปภาพด้านล่าง... ตามลำดับที่จำได้เมื่อกี้เลยนะครับ')}
                      className="bg-white/80 rounded-xl shadow px-6 py-3 hover:bg-blue-100 hover:scale-105 transition-all border-2 border-blue-300 text-2xl"
                      aria-label="ฟังคำแนะนำช่วงตอบ"
                      type="button"
                    >
                      🔊
                    </button>
                  </div>
                )}
                <div className="w-full flex justify-center mb-4">
                  <div className="grid grid-cols-2 gap-10" style={{minWidth: 540, maxWidth: 700}}>
                    <div className="rounded-2xl bg-white/80 shadow-lg flex flex-col items-center justify-center py-5 px-12 min-w-[240px] border border-blue-100">
                      <span className="text-blue-400 font-bold text-xs mb-1">เวลา</span>
                      <span className="text-3xl font-extrabold text-blue-600 tabular-nums">{('0' + Math.floor(timeElapsed / 60)).slice(-2)}:{('0' + (timeElapsed % 60)).slice(-2)}</span>
                    </div>
                    <div className="rounded-2xl bg-white/80 shadow-lg flex flex-col items-center justify-center py-5 px-12 min-w-[240px] border border-blue-100">
                      <span className="text-green-400 font-bold text-xs mb-1">ครั้ง</span>
                      <span className="text-3xl font-extrabold text-green-600 tabular-nums">{selectedOrder.filter(Boolean).length}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {showDisplayTimer && showImages && (
              <div className="w-full flex flex-col items-center mb-6 animate-fade-in gap-3">
                <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl px-8 py-4 shadow text-center flex flex-col items-center">
                  <div className="text-3xl md:text-4xl font-black text-yellow-800 mb-1">จำรูปภาพให้ดี!</div>
                  <div className="text-4xl md:text-5xl font-extrabold text-yellow-700">{displayTimer}</div>
                </div>
                {/* ปุ่มฟังซ้ำ */}
                <button
                  onClick={() => speak('จำลำดับของภาพเหล่านี้ให้ดีนะครับ... เริ่มจำได้เลยครับ')}
                  className="bg-white/90 rounded-xl shadow-lg px-6 py-3 hover:bg-yellow-200 hover:scale-105 transition-all border-2 border-yellow-300 text-3xl"
                  aria-label="ฟังคำแนะนำช่วงจำภาพ"
                  type="button"
                >
                  🔊
                </button>
              </div>
            )}

            {/* === Game Grid === */}
            {showImages ? (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-2xl flex items-center justify-center bg-white border-4 border-blue-300 shadow-md overflow-hidden"
                  >
                    <div className="absolute top-2 left-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg border-2 border-white z-10">
                      {image.order + 1}
                    </div>

                    {image.imageUrl && image.imageUrl.startsWith("/memory-images/") && !broken[image.order] ? (
                      <img
                        src={image.imageUrl}
                        alt={image.label}
                        className="w-full h-full object-contain"
                        onError={() => setBrokenAt(image.order)}
                      />
                    ) : (
                      <span className="text-5xl font-bold text-blue-900">{image.label}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* ช่องวางคำตอบ */}
                <div className="flex gap-4 justify-center mb-8 flex-wrap">
                  {Array.from({ length: images.length }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center border-4 cursor-pointer transition-all ${
                        selectedOrder[idx]
                          ? "bg-white border-green-400 shadow-md"
                          : "bg-white/50 border-dashed border-gray-300 hover:bg-white hover:border-gray-400"
                      }`}
                      onClick={() =>
                        selectedOrder[idx] && handleRemoveFromSlot(idx)
                      }
                    >
                      {!selectedOrder[idx] && (
                        <span className="text-4xl font-bold text-gray-300 select-none">{idx + 1}</span>
                      )}

                      {selectedOrder[idx] ? (
                        selectedOrder[idx]?.imageUrl &&
                        selectedOrder[idx]?.imageUrl.startsWith("/memory-images/") && !broken[idx] ? (
                          <img
                            src={selectedOrder[idx]!.imageUrl}
                            alt={selectedOrder[idx]!.label}
                            className="w-full h-full object-contain rounded-xl"
                            onError={() => setBrokenAt(idx)}
                          />
                        ) : (
                          <span className="text-5xl font-bold text-blue-900">
                            {selectedOrder[idx]?.label}
                          </span>
                        )
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* ตัวเลือกให้กด */}
                <div className="flex gap-4 justify-center mb-8 flex-wrap">
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
                        className="aspect-square w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center transition-all border-b-4 bg-white border-blue-300 hover:scale-105 hover:bg-blue-50 shadow-md active:border-b-0 active:translate-y-1"
                      >
                        {image.imageUrl && image.imageUrl.startsWith("/memory-images/") && !broken[image.order] ? (
                          <img
                            src={image.imageUrl}
                            alt={image.label}
                            className="w-full h-full object-contain rounded-xl p-1"
                            onError={() => setBrokenAt(image.order)}
                          />
                        ) : (
                          <span className="text-4xl font-bold text-blue-900">{image.label}</span>
                        )}
                      </button>
                    ))}
                </div>

                {/* ปุ่มตรวจคำตอบ */}
                <div className="flex justify-center mb-4">
                  <button
                    className={`px-12 py-4 text-2xl font-bold rounded-2xl shadow-xl transition-all border-b-4
                      ${selectedOrder.filter(Boolean).length === images.length 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-700 hover:scale-105 cursor-pointer' 
                          : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'}
                    `}
                    onClick={handleCheckAnswer}
                    // disabled={selectedOrder.filter(Boolean).length !== images.length} // ปิด disabled เพื่อให้กดแล้วมีเสียงเตือน
                  >
                    ✅ ส่งคำตอบ
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}