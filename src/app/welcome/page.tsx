'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

// ฟังก์ชันเลือกผลไม้ emoji จากชื่อผู้ใช้ (เดียวกับ profile page)
const getFruitEmoji = (username: string): string => {
  const fruits = ['🍎', '🍊', '🍌', '🍋', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍', '🥑', '🍈', '🍐'];
  
  // Hash username เพื่อให้ได้ผลไม้เดียวกันทุกครั้ง
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % fruits.length;
  return fruits[index];
};

export default function WelcomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [fruitEmoji, setFruitEmoji] = useState<string>('🍎');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkProfile = () => {
        const storedUsername = localStorage.getItem('profile_username');
        if (storedUsername) {
          setUsername(storedUsername);
          setFruitEmoji(getFruitEmoji(storedUsername));
        } else {
          setUsername(null);
          setFruitEmoji('🍎');
        }
      };
      checkProfile();
      window.addEventListener('storage', checkProfile);
      return () => window.removeEventListener('storage', checkProfile);
    }
  }, []);

  const generalGames = [
    {
      id: 'color-matching',
      title: 'เกมจับคู่สี',
      description: 'ฝึกความจำและการสังเกต',
      icon: '🎨',
      bgGradient: 'from-pink-100 to-rose-100',
      iconBg: 'bg-white',
      textColor: 'text-rose-600',
      btnColor: 'bg-rose-500 hover:bg-rose-600 border-rose-700',
      shadowColor: 'shadow-rose-200',
    },
    {
      id: 'fast-math',
      title: 'เกมบวกเลข',
      description: 'ฝึกการคิดคำนวณไว',
      icon: '🔢',
      bgGradient: 'from-orange-100 to-amber-100',
      iconBg: 'bg-white',
      textColor: 'text-orange-600',
      btnColor: 'bg-orange-500 hover:bg-orange-600 border-orange-700',
      shadowColor: 'shadow-orange-200',
    },
    {
      id: 'sequential-memory',
      title: 'เกมจำลำดับ',
      description: 'ฝึกความจำระยะสั้น',
      icon: '🖼️',
      bgGradient: 'from-emerald-100 to-green-100',
      iconBg: 'bg-white',
      textColor: 'text-emerald-600',
      btnColor: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700',
      shadowColor: 'shadow-emerald-200',
    },
    {
      id: 'animal-sound',
      title: 'ฟังเสียงสัตว์',
      description: 'ฝึกการฟังและจำแนก',
      icon: '🐕',
      bgGradient: 'from-sky-100 to-blue-100',
      iconBg: 'bg-white',
      textColor: 'text-sky-600',
      btnColor: 'bg-sky-500 hover:bg-sky-600 border-sky-700',
      shadowColor: 'shadow-sky-200',
    },
    {
      id: 'vocabulary',
      title: 'เกมจำศัพท์',
      description: 'ฝึกความจำด้านภาษา',
      icon: '📚',
      bgGradient: 'from-violet-100 to-purple-100',
      iconBg: 'bg-white',
      textColor: 'text-violet-600',
      btnColor: 'bg-violet-500 hover:bg-violet-600 border-violet-700',
      shadowColor: 'shadow-violet-200',
    },
  ];

  const tips = [
    { text: "เล่นเกมสม่ำเสมอเพื่อผลลัพธ์ที่ดีที่สุด", icon: "📅", color: "text-blue-600 bg-blue-100" },
    { text: "เริ่มจากระดับความยากต่ำ แล้วค่อย ๆ เพิ่มขึ้น", icon: "📈", color: "text-green-600 bg-green-100" },
    { text: "หากรู้สึกเบื่อ ให้หยุดพักและกลับมาเล่นใหม่", icon: "☕", color: "text-orange-600 bg-orange-100" },
    { text: "ตรวจสอบสถิติของคุณเพื่อติดตามความก้าวหน้า", icon: "🏆", color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-sans pb-12">
      
      {/* --- 1. Header --- */}
      <header className="bg-white shadow-md py-4 px-4 md:px-8 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧠</span>
            <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Brain Games</span>
                <span className="text-sm text-slate-500">เกมฝึกสมองสำหรับผู้สูงอายุ</span>
            </div>
          </div>

          <Link 
            href="/profile" 
            className={`flex items-center gap-4 px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-200 border-2 shadow-sm hover:shadow-md w-full md:w-auto min-w-[280px] justify-center md:justify-start ${
              username 
                ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400' 
                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-400'
            }`}
          >
             <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-4xl md:text-5xl border-2 border-white shadow-sm ${
               username
                 ? 'bg-gradient-to-br from-yellow-100 to-orange-100'
                 : 'bg-white'
             }`}>
               {username ? fruitEmoji : '👤'}
             </div>
            <div className="text-left">
              <p className={`text-sm md:text-base font-medium mb-0.5 ${username ? 'text-slate-500' : 'text-slate-400'}`}>
                {username ? 'สวัสดีครับ,' : 'ยังไม่ได้ล็อกอิน'}
              </p>
              <p className={`text-xl md:text-2xl font-bold truncate max-w-[180px] ${
                username ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {username || 'กรุณาล็อกอิน'}
              </p>
            </div>
            <div className={`text-2xl ml-auto pl-2 ${username ? 'text-blue-300' : 'text-gray-300'}`}>➔</div>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* --- 2. Daily Quiz Banner --- */}
        <section className="mb-12 mt-4">
          <Link href="/games/daily-quiz" className="group block relative overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-100"></div>
            {/* Pattern Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-base font-bold mb-4 backdrop-blur-sm border border-white/30 shadow-sm">
                  <span>📅</span> ภารกิจวันนี้
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md leading-tight">
                  ควิสประจำวัน
                </h2>
                <p className="text-indigo-50 text-xl md:text-2xl font-light">
                  เล่น 3 เกมสั้นๆ เพื่อสะสมคะแนนต่อเนื่อง
                </p>
              </div>
              <div className="flex-shrink-0">
                 <span className="bg-white text-indigo-600 px-10 py-5 rounded-2xl text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform inline-flex items-center gap-3 border-b-4 border-indigo-200 active:border-b-0 active:translate-y-1">
                    เล่นเลย <span className="text-3xl">▶</span>
                 </span>
              </div>
            </div>
          </Link>
        </section>

        {/* --- 3. New Game Cards Grid (แก้ไข Layout) --- */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
             <h2 className="text-3xl font-bold text-slate-700 flex items-center gap-3">
               <span className="w-3 h-10 bg-blue-500 rounded-full block shadow-md"></span>
               เลือกเกมที่ต้องการเล่น
             </h2>
             <div className="h-[2px] bg-slate-200 flex-1 rounded-full"></div>
          </div>
          
          {/* 🔴 เปลี่ยนจาก 'grid' เป็น 'flex' และ 'justify-center' 
             เพื่อให้การ์ดแถวสุดท้ายอยู่ตรงกลางเสมอ ไม่เกิดช่องว่าง 
          */}
          <div className="flex flex-wrap justify-center gap-8">
            {generalGames.map((game) => (
              <Link 
                key={game.id} 
                href={`/games/${game.id}`}
                className={`
                  group relative bg-white rounded-[2rem] p-2
                  shadow-lg hover:shadow-2xl hover:shadow-blue-200/50
                  transition-all duration-300 transform hover:-translate-y-2
                  border border-slate-100
                  /* 🟢 กำหนดความกว้างของการ์ดให้ยืดหยุ่น */
                  w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.33%-2rem)] max-w-sm
                `}
              >
                {/* Inner Container */}
                <div className={`
                    h-full rounded-[1.8rem] p-6 flex flex-col items-center text-center
                    bg-gradient-to-b ${game.bgGradient} bg-opacity-30
                `}>
                    
                    {/* Icon Circle */}
                    <div className={`
                        w-32 h-32 mb-6 rounded-full flex items-center justify-center text-7xl 
                        shadow-md group-hover:scale-110 transition-transform duration-300
                        ${game.iconBg}
                    `}>
                        {game.icon}
                    </div>
                    
                    {/* Text Content */}
                    <h3 className={`text-3xl font-bold mb-3 ${game.textColor}`}>
                        {game.title}
                    </h3>
                    <p className="text-xl text-slate-600 mb-8 font-medium opacity-90 leading-relaxed">
                        {game.description}
                    </p>
                    
                    {/* 3D Button Style */}
                    <div className={`
                        mt-auto w-full py-4 rounded-xl text-white font-bold text-2xl 
                        shadow-lg border-b-4 active:border-b-0 active:translate-y-1
                        transition-all duration-150 flex items-center justify-center gap-2
                        ${game.btnColor}
                    `}>
                        เริ่มเล่น <span>➔</span>
                    </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 4. Tips Section --- */}
        <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border-t-8 border-yellow-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full -mr-32 -mt-32 opacity-50 z-0"></div>

          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
              <span className="flex items-center justify-center w-14 h-14 bg-yellow-100 rounded-2xl text-3xl shadow-sm">💡</span>
              เคล็ดลับการเล่นให้ได้ผลดี
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                  <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl shadow-sm ${tip.color}`}>
                    {tip.icon}
                  </div>
                  <div>
                    <p className="text-xl text-slate-700 font-semibold leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="text-center text-slate-400 mt-16 pb-8 text-lg font-medium">
        <p>© 2025 Brain Games for Seniors | เพื่อสุขภาพที่ดีของผู้สูงอายุ</p>
      </footer>
    </div>
  );
}