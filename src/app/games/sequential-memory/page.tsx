'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateSequentialImages, saveGameHistory } from '@/utils/gameUtils'
import { useTTS } from '@/hooks/useTTS' 

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

function SequentialMemoryGameContent() {
    // Card sound effect
    const cardSoundRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      const audio = new Audio('/sounds/sound-effects/card.mp3');
      audio.preload = 'auto';
      cardSoundRef.current = audio;
      return () => {
        audio.pause();
        cardSoundRef.current = null;
      };
    }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDailyMode = searchParams.get('mode') === 'daily';
  const levelFromQuery = parseInt(searchParams.get('level') || '1', 10);
  const dailyStep = searchParams.get('dailyStep');
  // ✅ 1. เพิ่มรับค่า sound
  const soundParam = searchParams.get('sound');

  const { speak, cancel } = useTTS();
  const [hasInteracted, setHasInteracted] = useState(false); 
  const [soundDisabled, setSoundDisabled] = useState(false);

  // ✅ State สำหรับเช็คว่ากำลังอธิบายกติกาอยู่หรือไม่
  const [isNarratingPreview, setIsNarratingPreview] = useState(false);
  const [isNarratingPlay, setIsNarratingPlay] = useState(false);

  // ✅ 2. แก้ไข useEffect นี้ให้รับค่า sound
  useEffect(() => {
    if (isDailyMode) {
        setHasInteracted(true);
        if (soundParam === 'off') {
            setSoundDisabled(true);
            cancel();
        } else {
            setSoundDisabled(false);
        }
    }
  }, [isDailyMode, soundParam, cancel]);

  const hasSpokenWelcome = useRef(false);
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

  // พูดเมื่อเริ่มจำภาพ (Phase 1) - มีการรอให้พูดจบก่อนเวลาเดิน
  useEffect(() => {
    if (gameStarted && showDisplayTimer && displayTimer === 15 && !soundDisabled) {
        setIsNarratingPreview(true);
        speak("จำลำดับของภาพเหล่านี้ให้ดีนะครับ... เริ่มจำได้เลยครับ");
        const t = setTimeout(() => {
            setIsNarratingPreview(false);
        }, 4500); // หน่วงเวลาประมาณ 4.5 วิรอพูดจบ
        return () => clearTimeout(t);
    }
  }, [gameStarted, showDisplayTimer, displayTimer, speak, soundDisabled]);

  // พูดเมื่อเริ่มตอบ (Phase 2) - มีการรอให้พูดจบก่อนเวลาเดิน
  useEffect(() => {
    if (gameStarted && !showDisplayTimer && !showImages && !gameCompleted && timeElapsed === 0 && !soundDisabled) {
        setIsNarratingPlay(true);
        speak("หมดเวลาจำแล้วครับ... ให้เรียงรูปภาพด้านล่าง... ตามลำดับที่จำได้เมื่อกี้เลยนะครับ");
        const t = setTimeout(() => {
            setIsNarratingPlay(false);
        }, 6000); // หน่วงเวลาประมาณ 6 วิรอพูดจบ
        return () => clearTimeout(t);
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
      copy[idx] = null; // ลบเฉพาะช่องนี้ ไม่ขยับรูปอื่น
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
        // Play card sound
        if (cardSoundRef.current) {
          cardSoundRef.current.currentTime = 0;
          cardSoundRef.current.play().catch(() => {});
        }
        return copy;
      });
    }
  }

  // Drag and Drop handlers
  const [draggedImage, setDraggedImage] = useState<SequentialImageItem | null>(null);
  const [dragSource, setDragSource] = useState<'pool' | 'slot' | null>(null);

  // เริ่มลากจากแผงเลือกหรือช่องตอบ
  const handleDragStart = (e: React.DragEvent, image: SequentialImageItem, source: 'pool' | 'slot') => {
    setDraggedImage(image);
    setDragSource(source);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // วางลงในช่องตอบ (slot)
  const handleDropOnSlot = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    if (!draggedImage) return;
    setSelectedOrder(prev => {
      const copy = [...prev];
      // ถ้าลากจาก slot อื่น ให้ช่องต้นทางเป็น null
      if (dragSource === 'slot') {
        const fromIdx = prev.findIndex(item => item && item.id === draggedImage.id);
        if (fromIdx !== -1) copy[fromIdx] = null;
      }
      // วางทับช่องเป้าหมาย (ถ้ามีรูปเดิมในช่องนี้จะถูกแทนที่และช่องเดิมจะว่าง)
      copy[slotIdx] = draggedImage;
      // Play card sound
      if (cardSoundRef.current) {
        cardSoundRef.current.currentTime = 0;
        cardSoundRef.current.play().catch(() => {});
      }
      return copy;
    });
    setDraggedImage(null);
    setDragSource(null);
  };

  // วางกลับลงแผงเลือก (pool)
  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedImage) return;
    if (dragSource === 'slot') {
      setSelectedOrder(prev => {
        const copy = [...prev];
        const fromIdx = prev.findIndex(item => item && item.id === draggedImage.id);
        if (fromIdx !== -1) copy[fromIdx] = null;
        // Play card sound
        if (cardSoundRef.current) {
          cardSoundRef.current.currentTime = 0;
          cardSoundRef.current.play().catch(() => {});
        }
        return copy;
      });
    }
    setDraggedImage(null);
    setDragSource(null);
  };

  // initializeGame intentionally excluded to avoid dependency churn; trigger is controlled by mode and level.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isDailyMode && !gameStarted && !gameCompleted) {
        const timer = setTimeout(() => {
            initializeGame(levelFromQuery);
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [isDailyMode, levelFromQuery, gameStarted, gameCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⏱️ นับเวลาตอนจำภาพ (เพิ่มเงื่อนไขไม่ให้เวลาเดินถ้ายังอธิบายไม่จบ)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (showDisplayTimer && !isNarratingPreview) {
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
  }, [showDisplayTimer, images, isNarratingPreview]);

  // ⏱️ นับเวลาตอนเล่นเกม (เพิ่มเงื่อนไขไม่ให้เวลาเดินถ้ายังอธิบายไม่จบ)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!showDisplayTimer && gameStarted && !gameCompleted && !showImages && !isNarratingPlay) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [showDisplayTimer, gameStarted, gameCompleted, showImages, isNarratingPlay]);

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
            gameType: 'sequential-memory',
            score: score
          })
        })
        .then(res => res.json())
        .then(data => console.log('Score saved:', data))
        .catch(err => console.error('Error saving score:', err));
      }
    }
  }, [gameCompleted, isSaving, score, isDailyMode]);

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
    setIsNarratingPreview(false); // ✅ Reset สถานะการอธิบาย
    setIsNarratingPlay(false);

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

            {/* เฉลยและตรวจคำตอบ (อันแรก ลบออกได้ถ้าซ้ำ แต่ผมแก้ขนาดให้เป๊ะตามที่คุณต้องการ) */}
            <div className="w-full max-w-2xl mx-auto mt-8 mb-4 hidden">
              <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">ตรวจคำตอบของคุณ</h3>
            </div>

            {/* เฉลยและตรวจคำตอบ (ใช้งานจริง) */}
            <div className="w-full max-w-3xl mx-auto mt-8 mb-4">
              <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">ตรวจคำตอบของคุณ</h3>
              <div className="relative flex flex-col md:flex-row gap-0 items-stretch bg-white rounded-3xl shadow border border-blue-100 overflow-hidden">
                {/* เฉลยลำดับที่ถูกต้อง */}
                <div className="flex-1 p-4 md:p-6 flex flex-col items-center">
                  <div className="font-bold text-green-700 mb-4 text-center text-lg">✅ ลำดับที่ถูกต้อง</div>
                  <div className="grid grid-cols-3 gap-3 place-items-center">
                    {images.map((img, idx) => (
                      <div key={img.id} className="w-[80px] h-[100px] md:w-[90px] md:h-[110px] flex flex-col items-center justify-center border-4 border-green-400 rounded-xl p-2 bg-green-50 shadow-sm">
                        {img.imageUrl && img.imageUrl.startsWith("/memory-images/") ? (
                          <img src={img.imageUrl} alt={img.label} className="w-12 h-12 md:w-14 md:h-14 object-contain mb-1" />
                        ) : (
                          <span className="text-3xl mb-1">{img.label}</span>
                        )}
                        <span className="text-sm text-green-700 font-bold mt-1 leading-none">{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* เส้นแบ่งแนวตั้ง/แนวนอน */}
                <div className="w-full h-px md:w-px md:h-auto bg-gray-300 mx-0 my-4 md:my-6 md:mx-0"></div>

                {/* คำตอบของคุณ */}
                <div className="flex-1 p-4 md:p-6 flex flex-col items-center">
                  <div className="font-bold text-blue-700 mb-4 text-center text-lg">👤 คำตอบของคุณ</div>
                  <div className="grid grid-cols-3 gap-3 place-items-center">
                    {selectedOrder.map((img, idx) => {
                      const isCorrect = img && img.id === images[idx]?.id;
                      return (
                        <div key={idx} className={`w-[80px] h-[100px] md:w-[90px] md:h-[110px] flex flex-col items-center justify-center border-4 rounded-xl p-2 shadow-sm ${isCorrect ? 'bg-green-50 border-green-400' : img ? 'bg-red-50 border-red-400' : 'bg-gray-50 border-gray-200'}`}>
                            {img ? (
                              img.imageUrl && img.imageUrl.startsWith("/memory-images/") ? (
                                <img src={img.imageUrl} alt={img.label} className="w-12 h-12 md:w-14 md:h-14 object-contain mb-1" />
                              ) : (
                                <span className="text-3xl font-bold text-blue-900 mb-1">{img.label}</span>
                              )
                            ) : (
                              <span className="text-gray-400 text-3xl mb-1">-</span>
                            )}
                          <span className={`flex items-center gap-1 text-sm font-bold mt-1 leading-none ${isCorrect ? 'text-green-700' : img ? 'text-red-600' : 'text-gray-400'}`}>
                            {img ? (isCorrect ? idx+1 : <><span className="text-red-500 text-xs">ผิด</span></>) : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
                    <p className="text-xl font-bold text-yellow-900 mb-3">ขั้นที่ 2: เตรียมซ่อนภาพ</p>
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

            <div className="text-center mb-6">
              <div className="inline-block p-6 bg-[#FFD180] rounded-[2.5rem] shadow-lg mb-4">
                <span className="text-8xl filter drop-shadow-sm">🖼️</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-[#1e3a8a] mb-3 tracking-tight drop-shadow-sm">
                เกมจำลำดับภาพ
              </h1>
              <p className="text-xl text-slate-700 font-bold mb-1">ฝึกความจำและลำดับ</p>
              <p className="text-base text-slate-500 font-medium">จำลำดับรูปภาพ แล้วเรียงให้ถูกต้อง</p>
            </div>

            {/* ปุ่มฟังคำแนะนำ + ตัวอย่างการเล่น */}
            <div className="flex flex-row justify-center mb-8 gap-4 items-center w-full">
              <button 
                onClick={() => speak('เลือกระดับเกม แล้วกดปุ่มเริ่มเล่นเพื่อเริ่มเกมครับ')}
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
            
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-xl justify-center items-stretch mb-8 px-4">
              <button
                onClick={() => {
                  setDifficulty(1);
                  if (!soundDisabled) speak("เลือกระดับง่าย จำนวนรูปน้อย เหมาะเริ่มฝึกฝน");
                }}
                className={`flex-1 group relative bg-white rounded-[2rem] p-6 transition-all duration-300 flex flex-col items-center justify-center
                  ${difficulty === 1
                    ? 'shadow-[0_4px_20px_rgba(59,130,246,0.5)] scale-[1.02] border-4 border-blue-400'
                    : 'shadow-lg border-4 border-transparent hover:border-blue-200 hover:shadow-xl'
                  }`}
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-3 shadow-sm">😊</div>
                <h3 className={`text-2xl font-black mb-1 ${difficulty === 1 ? 'text-[#2563EB]' : 'text-[#1e3a8a]'}`}>ระดับง่าย</h3>
                <p className="text-xs text-slate-500 font-semibold">จำนวนรูปน้อย เริ่มต้นฝึกฝน</p>
              </button>

              <button
                onClick={() => {
                  setDifficulty(2);
                  if (!soundDisabled) speak("เลือกระดับยาก ท้าทายความจำ จำนวนรูปเยอะขึ้น");
                }}
                className={`flex-1 group relative bg-white rounded-[2rem] p-6 transition-all duration-300 flex flex-col items-center justify-center
                  ${difficulty === 2
                    ? 'shadow-[0_4px_20px_rgba(168,85,247,0.5)] scale-[1.02] border-4 border-purple-400'
                    : 'shadow-lg border-4 border-transparent hover:border-purple-200 hover:shadow-xl'
                  }`}
              >
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-5xl mb-3 shadow-sm">🤓</div>
                <h3 className={`text-2xl font-black mb-1 ${difficulty === 2 ? 'text-[#7C3AED]' : 'text-[#581c87]'}`}>ระดับยาก</h3>
                <p className="text-xs text-slate-500 font-semibold">ท้าทายความจำ จำนวนรูปเยอะขึ้น</p>
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4 relative z-20">
              {/* ปุ่มเริ่มเล่น */}
              <button
                onClick={() => { if (!difficulty) return; if (!soundDisabled) speak("เริ่มเกมครับ"); initializeGame(); }}
                disabled={!difficulty}
                className={`w-full py-3.5 rounded-[2rem] text-xl font-black shadow-md transition-all duration-200
                  ${!difficulty
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white hover:scale-105 hover:shadow-lg cursor-pointer'
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
                  className="w-full py-3.5 rounded-[2rem] bg-[#3B82F6] text-white font-black text-xl hover:bg-[#2563EB] transition-all shadow-md"
                >
                  หน้าเลือกเกม
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
                      <span className="text-6xl font-extrabold text-green-700 drop-shadow-lg leading-none">{score}</span>
                      <span className="text-4xl font-bold text-blue-700 leading-none">/ {images.length}</span>
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

            {/* เฉลยและตรวจคำตอบ */}
            <div className="w-full max-w-3xl mx-auto mt-8 mb-4">
              <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">ตรวจคำตอบของคุณ</h3>
              <div className="relative flex flex-col md:flex-row gap-0 items-stretch bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
                {/* เฉลยลำดับที่ถูกต้อง */}
                <div className="flex-1 p-4 md:p-6 flex flex-col items-center">
                  <div className="font-bold text-green-700 mb-4 text-center text-lg">✅ ลำดับที่ถูกต้อง</div>
                  <div className="grid grid-cols-3 gap-3 place-items-center">
                    {images.map((img, idx) => (
                      <div key={img.id} className="w-[80px] h-[100px] md:w-[90px] md:h-[110px] flex flex-col items-center justify-center bg-green-50 border-2 border-green-300 rounded-xl p-2 shadow-sm">
                        {img.imageUrl && img.imageUrl.startsWith("/memory-images/") ? (
                          <img src={img.imageUrl} alt={img.label} className="w-12 h-12 md:w-14 md:h-14 object-contain mb-1" />
                        ) : (
                          <span className="text-3xl font-bold text-green-900 mb-1">{img.label}</span>
                        )}
                        <span className="text-sm font-bold text-green-800 leading-none mt-1">{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* เส้นแบ่งแนวตั้ง/แนวนอน */}
                <div className="w-full h-px md:w-px md:h-auto bg-gray-300 mx-0 my-4 md:my-6 md:mx-0"></div>

                {/* คำตอบของคุณ */}
                <div className="flex-1 p-4 md:p-6 flex flex-col items-center">
                  <div className="font-bold text-blue-700 mb-4 text-center text-lg">👤 คำตอบของคุณ</div>
                  <div className="grid grid-cols-3 gap-3 place-items-center">
                    {selectedOrder.map((img, idx) => {
                      const isCorrect = img && img.id === images[idx].id;
                      return (
                        <div key={idx} className={`w-[80px] h-[100px] md:w-[90px] md:h-[110px] flex flex-col items-center justify-center rounded-xl p-2 shadow-sm border-2 ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-400'}`}>
                          {img ? (
                            img.imageUrl && img.imageUrl.startsWith("/memory-images/") ? (
                              <img src={img.imageUrl} alt={img.label} className="w-12 h-12 md:w-14 md:h-14 object-contain mb-1" />
                            ) : (
                              <span className="text-3xl font-bold text-blue-900 mb-1">{img.label}</span>
                            )
                          ) : (
                            <span className="text-3xl font-bold text-gray-400 mb-1">-</span>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-sm font-bold leading-none ${isCorrect ? 'text-green-800' : 'text-red-700'}`}>{idx+1}</span>
                            {!isCorrect && <span className="text-xs text-red-500 font-bold leading-none">ผิด</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {isDailyMode ? (
              <div className="flex justify-center mb-4 mt-6">
                  <button 
                  onClick={() => router.push(`/games/daily-quiz?action=next&playedStep=${dailyStep}`)} 
                  className="w-full max-w-md py-4 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                  ✅ ผ่านด่าน (ไปต่อ)
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4 justify-center mb-2 mt-6">
                {difficulty === 1 && (
                  <button 
                    onClick={() => { 
                      if (!soundDisabled) speak("เริ่มเกมระดับยากครับ");
                      setDifficulty(2); 
                      setTimeout(() => initializeGame(2), 100); 
                    }} 
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
                    หน้าเลือกเกม
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
                  <span className="text-lg">✕</span> เลิกเล่น
                </button>
              )}
              
              <div className="flex-1 flex flex-col items-end">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1 pr-1">LEVEL</span>
                <span className="text-3xl font-extrabold text-blue-700 drop-shadow-sm">{difficulty === 1 ? 'ระดับง่าย' : 'ระดับยาก'}</span>
              </div>
            </div>

            {/* Stats Bar */}
            {!showDisplayTimer && (
              <>
                {!showImages && (
                  <div className="w-full flex flex-col items-center gap-3 mb-4">
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

                {/* ปรับ layout เป็น 3 คอลัมน์: สถิติ (250px), ช่องตอบ (flex-1), แผงเลือก (420px) */}
                <div className="w-full max-w-6xl mx-auto mb-8 flex flex-col gap-8 items-center justify-center">
                  {/* 1. สถิติ (ซ้าย) */}
                  <div className="w-full lg:w-[250px] flex flex-col gap-4">
                  </div>

                  {/* 2. ช่องตอบ (กลาง) */}
                  <div className="w-full max-w-xs md:max-w-md lg:max-w-xl flex flex-col items-center bg-white/30 backdrop-blur-sm p-2 md:p-6 rounded-[4rem] border-8 border-dashed border-blue-200 shadow-inner mx-auto">
                    <h3 className="text-2xl font-black text-blue-800 mb-6 bg-white/80 px-8 py-2 rounded-full shadow-sm">🧩 วางภาพลำดับที่นี่</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 w-full max-w-xs md:max-w-md lg:max-w-xl">
                      {Array.from({ length: images.length }).map((_, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectedOrder[idx] && handleRemoveFromSlot(idx)}
                          onDragOver={handleDragOver}
                          onDrop={e => handleDropOnSlot(e, idx)}
                          className={`relative aspect-square rounded-xl border-4 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-xl overflow-hidden
                            ${selectedOrder[idx] ? "bg-white border-green-400 scale-105" : "bg-gray-50/50 border-gray-200 hover:bg-white hover:border-blue-300"}`}
                          draggable={!!selectedOrder[idx]}
                          onDragStart={selectedOrder[idx] ? (e) => handleDragStart(e, selectedOrder[idx]!, 'slot') : undefined}
                        >
                          {!selectedOrder[idx] && <span className="text-6xl font-black text-gray-200">{idx + 1}</span>}
                          {selectedOrder[idx] && <img src={selectedOrder[idx]!.imageUrl} alt={selectedOrder[idx]!.label} className="w-full h-full object-contain p-4" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. แผงเลือกรูปภาพ (ล่าง) */}
                  <div className="w-full max-w-xs md:max-w-md lg:max-w-xl h-auto max-h-fit mt-2 mx-auto">
                    <div
                      className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8 pb-2 mt-[-32px] ml-8 md:ml-16"
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnPool}
                    >
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
                            onDragStart={(e) => handleDragStart(e, image, 'pool')}
                            draggable
                            className="relative w-24 h-24 rounded-lg border-8 bg-white shadow p-1 flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:border-blue-400 overflow-hidden cursor-grab active:cursor-grabbing"
                          >
                            {image.imageUrl && image.imageUrl.startsWith("/memory-images/") && !broken[image.order] ? (
                              <img
                                src={image.imageUrl}
                                alt={image.label}
                                className="w-5/6 h-5/6 object-contain pointer-events-none"
                                onError={() => setBrokenAt(image.order)}
                              />
                            ) : (
                              <span className="text-3xl font-black text-blue-900">{image.label}</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
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

export default function SequentialMemoryGame() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-2xl text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>}>
      <SequentialMemoryGameContent />
    </Suspense>
  )
}
