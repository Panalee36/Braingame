'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// --- Interface ---
interface GameStatistic {
  key: string;
  gameType: string;
  gamesPlayed: number;
  averageScore: number;
  highScore: number;
  lastPlayed: string;
  icon: string; // เพิ่ม icon string เพื่อความง่ายในการแสดงผล
}

interface HistoryItem {
  score: number;
  date: string;
}

// --- Logout Logic ---
const handleLogout = () => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem('profile_username');
  localStorage.removeItem('profile_age');
  localStorage.removeItem('anonId');
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('stat_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export default function ProfilePage() {
  // เพิ่ม icon emoji เข้าไปในข้อมูลเริ่มต้น
  const [statistics, setStatistics] = useState<GameStatistic[]>([
    { key: 'color-matching', gameType: 'เกมจับคู่สี', gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-', icon: '🎨' },
    { key: 'fast-math', gameType: 'เกมบวกเลข', gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-', icon: '➕' },
    { key: 'sequential-memory', gameType: 'เกมจำลำดับภาพ', gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-', icon: '🧠' },
    { key: 'animal-sound', gameType: 'เกมฟังเสียงสัตว์', gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-', icon: '🐶' },
    { key: 'vocabulary', gameType: 'เกมจำศัพท์', gamesPlayed: 0, averageScore: 0, highScore: 0, lastPlayed: '-', icon: '📚' },
  ]);

  const [gameHistories, setGameHistories] = useState<Record<string, HistoryItem[]>>({});
  const [anonId, setAnonId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  

  const router = useRouter();

  // 1. โหลดข้อมูล History
  useEffect(() => {
    const histories: Record<string, HistoryItem[]> = {};
    statistics.forEach((stat) => {
      const raw = localStorage.getItem(`stat_${stat.key}_history`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          histories[stat.key] = Array.isArray(parsed) ? parsed.reverse() : [];
        } catch {
          histories[stat.key] = [];
        }
      } else {
        histories[stat.key] = [];
      }
    });
    setGameHistories(histories);
  }, []);

  // 2. Check Auth
  useEffect(() => {
    const hasToken = document.cookie.split(';').some((item) => item.trim().startsWith('token='));
    const hasLocalProfile = typeof window !== 'undefined' && (localStorage.getItem('profile_username') || localStorage.getItem('anonId'));
    
    if (!hasToken && !hasLocalProfile) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  // 3. Load Stats & Profile
  useEffect(() => {
    setAnonId(localStorage.getItem('anonId'));
    setUsername(localStorage.getItem('profile_username'));
    setAge(localStorage.getItem('profile_age'));

    setStatistics((prevStats) =>
      prevStats.map((stat) => {
        const raw = localStorage.getItem(`stat_${stat.key}`);
        if (!raw) return stat;
        try {
          const data = JSON.parse(raw);
          return {
            ...stat,
            gamesPlayed: Number(data.gamesPlayed) || 0,
            averageScore: Number(data.averageScore) || 0,
            highScore: Number(data.highScore) || 0,
            lastPlayed: data.lastPlayed || '-',
          };
        } catch {
          return stat;
        }
      })
    );
  }, []);

  const onLogout = useCallback(() => {
    handleLogout();
    router.replace('/login');
  }, [router]);


  // --- 💡 ปรับปรุง Avatar URL ---
  // ใช้ 'avataaars' ให้ดูเป็นคนมากขึ้น และบังคับให้ยิ้ม (mouth=smile) เสมอ
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'user'}&mouth=smile&eyebrows=default&eyes=happy`;

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-xl text-blue-600">กำลังโหลดข้อมูล...</div>;

  // คำนวณสถิติ
  const totalGamesPlayed = statistics.reduce((sum, stat) => sum + stat.gamesPlayed, 0);
  const activeGamesCount = statistics.filter(s => s.gamesPlayed > 0).length;
  // const calculatedAverageScore = activeGamesCount > 0 
  //   ? statistics.reduce((sum, stat) => sum + stat.averageScore, 0) / activeGamesCount 
  //   : 0;
  const bestGame = statistics.reduce((prev, current) => (prev.highScore > current.highScore) ? prev : current);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      
      {/* --- ส่วน Header พื้นหลังสีฟ้า --- */}
      <div className="bg-blue-600 pb-24 pt-10 px-4 md:px-8 rounded-b-[3rem] shadow-lg">
        <div className="max-w-4xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-6">
          
          {/* Avatar กรอบใหญ่ชัดเจน */}
          <div className="relative">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            {/* ป้ายอายุแบบชัดๆ */}
            {age && (
              <div className="absolute bottom-0 right-0 bg-orange-400 text-white text-lg font-bold px-4 py-1 rounded-full shadow-md border-2 border-white">
                อายุ {age}
              </div>
            )}
          </div>

          <div className="text-white flex-1">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-md">
              สวัสดีคุณ {username || 'สมาชิก'}!
            </h1>
            <p className="text-blue-100 text-lg md:text-xl font-light">
              ยินดีต้อนรับกลับมาฝึกสมองกันนะครับ
            </p>
            <div className="mt-2 text-sm text-blue-200 opacity-80">
              รหัสสมาชิก: {anonId || '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16">
        
        {/* --- การ์ดสถิติรวม (เน้นตัวใหญ่ อ่านง่าย) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-3xl p-6 shadow-lg flex items-center justify-between border-l-8 border-blue-500">
                <div>
                    <p className="text-gray-500 text-lg font-semibold">เล่นไปแล้วทั้งหมด</p>
                    <p className="text-4xl md:text-5xl font-bold text-slate-800 mt-1">{totalGamesPlayed} <span className="text-xl font-normal text-gray-400">ครั้ง</span></p>
                </div>
                <div className="text-5xl opacity-20">🎮</div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-lg flex items-center justify-between border-l-8 border-green-500">
                <div>
                    <p className="text-gray-500 text-lg font-semibold">เกมที่ทำได้ดีที่สุด</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">{bestGame.highScore > 0 ? bestGame.gameType : '-'}</p>
                    <p className="text-green-600 font-bold text-xl">สูงสุด {bestGame.highScore} คะแนน</p>
                </div>
                <div className="text-5xl opacity-20">🏆</div>
            </div>
        </div>

        {/* --- ปุ่มเมนูหลัก (ปุ่มใหญ่พิเศษ) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Link href="/welcome" className="bg-blue-600 hover:bg-blue-700 text-white text-xl md:text-2xl font-bold py-6 rounded-2xl shadow-lg text-center transition-transform active:scale-95 flex items-center justify-center gap-3">
                <span>🎮</span> กลับไปหน้าเลือกเกม
            </Link>
            <button onClick={onLogout} className="bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 text-xl font-bold py-6 rounded-2xl text-center transition-colors">
                ออกจากระบบ
            </button>
        </div>

        {/* --- รายการประวัติการเล่น --- */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-6 border-b-2 border-gray-200 pb-2">
            📋 ประวัติผลการเล่นของคุณ
        </h2>

        <div className="space-y-5">
            {statistics.map((stat) => {
              const history = gameHistories[stat.key] || [];
              return (
                <div key={stat.key} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  {/* ส่วนหัวของ Card (compact) */}
                  <div className="p-3 md:p-4 flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl shadow-inner">
                        {stat.icon}
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800">{stat.gameType}</h3>
                        <p className="text-gray-500 text-sm md:text-base">เล่นล่าสุด: {stat.lastPlayed}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-xl">
                      <div className="text-center md:text-right">
                        <p className="text-xs md:text-sm text-gray-500 font-semibold">คะแนนสูงสุด</p>
                        <p className="text-xl md:text-2xl font-black text-blue-600">{stat.highScore}</p>
                      </div>
                    </div>
                  </div>
                  {/* ตารางประวัติ (แสดงตลอด, compact) */}
                  <div className="bg-slate-50 max-h-60 overflow-y-auto">
                    {history.length > 0 ? (
                      <table className="w-full text-left border-t border-gray-200">
                        <thead className="bg-gray-200 text-gray-600 text-base md:text-lg">
                          <tr>
                            <th className="px-4 py-2 font-semibold">วันที่และเวลา</th>
                            <th className="px-4 py-2 text-right font-semibold">คะแนนที่ได้</th>
                          </tr>
                        </thead>
                        <tbody className="text-base md:text-lg">
                          {history.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 bg-white hover:bg-blue-50">
                              <td className="px-4 py-2 text-slate-700">
                                {new Date(item.date).toLocaleDateString('th-TH', {
                                  year: '2-digit', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })} น.
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-blue-700">
                                {item.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-base">
                        ยังไม่เคยเล่นเกมนี้เลย ลองไปเล่นดูนะครับ!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}