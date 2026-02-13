'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { requestNotificationPermission } from '@/utils/requestNotification' // ✅ 1. เพิ่ม import

// Interface สำหรับข้อมูลประวัติการเล่น
interface GameStat {
  id: string;
  name: string;
  icon: string;
  key: string; // key สำหรับ filter ข้อมูลจาก API
  color: string;
  gamesPlayed: number;
  highScore: number;
  lastPlayed: string;
}

// Interface สำหรับประวัติการเล่นแต่ละครั้ง
interface GameHistory {
  _id: string;
  userId: string;
  gameType: string;
  score: number;
  createdAt: string;
}

// ฟังก์ชันเลือกผลไม้ emoji จากชื่อผู้ใช้
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

export default function ProfilePage() {
  const router = useRouter();
  
  // State ข้อมูลผู้ใช้
  const [profile, setProfile] = useState({
    username: '',
    age: '',
    joinedDate: '-',
    fruitEmoji: ''
  });

  // State สถิติและประวัติ
  const [statistics, setStatistics] = useState<GameStat[]>([
    { id: '1', name: 'เกมจับคู่สี', icon: '🎨', key: 'color-matching', color: 'bg-pink-100 text-pink-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '2', name: 'บวกลบเลข', icon: '🔢', key: 'fast-math', color: 'bg-blue-100 text-blue-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '3', name: 'เกมจำลำดับภาพ', icon: '🖼️', key: 'sequential-memory', color: 'bg-purple-100 text-purple-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '4', name: 'เกมฟังเสียงสัตว์', icon: '🐕', key: 'animal-sound', color: 'bg-green-100 text-green-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '5', name: 'เกมจำศัพท์', icon: '📚', key: 'vocabulary', color: 'bg-yellow-100 text-yellow-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameStat | null>(null);
  const [gameHistoryDetail, setGameHistoryDetail] = useState<GameHistory[]>([]);

  // โหลดข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    // 0. ตรวจสอบว่า User ได้ Login หรือไม่
    const userId = localStorage.getItem('userId');
    if (!userId) {
      // ถ้าไม่มี userId แสดงว่ายังไม่ได้ Login ให้ Redirect ไปหน้า Login
      router.push('/login');
      return;
    }

    // 1. โหลดข้อมูล Profile เบื้องต้นจาก localStorage
    const storedUsername = localStorage.getItem('profile_username');
    const storedAge = localStorage.getItem('profile_age');
    
    const storedCreatedAt = localStorage.getItem('profile_createdAt');
    const legacyJoinedDate = localStorage.getItem('profile_joinedDate');
    const joinedDateSource = storedCreatedAt || legacyJoinedDate;
    const formattedJoinedDate = joinedDateSource
      ? new Date(joinedDateSource).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '-';
    if (storedUsername) {
      setProfile(prev => ({
        ...prev,
        username: storedUsername,
        age: storedAge || '',
        joinedDate: formattedJoinedDate,
        fruitEmoji: getFruitEmoji(storedUsername)
      }));
    }

    // 2. ดึงประวัติการเล่นจาก Database
    const fetchHistory = async () => {
        const userId = localStorage.getItem('userId'); // ดึง ID คนที่ล็อกอินอยู่
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/game/history`);
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            const data = await res.json();

            if (data.success) {
                const historyData = data.history; // ข้อมูลดิบทั้งหมดจาก DB
                
                // คำนวณสถิติใหม่จากข้อมูลที่ดึงมา
                setStatistics(prevStats => prevStats.map(stat => {
                    // กรองเอาเฉพาะเกมนั้นๆ
                    const gameLogs = historyData.filter((h: any) => h.gameType === stat.key);
                    const gamesPlayed = gameLogs.length;
                    // หาคะแนนสูงสุด (ถ้าไม่มีข้อมูลให้เป็น 0)
                    let highScore = gameLogs.length > 0 
                      ? Math.max(...gameLogs.map((h: any) => Number(h.score))) 
                      : 0;
                    // จำกัดคะแนนสูงสุดของ animal-sound ไม่เกิน 5
                    if (stat.key === 'animal-sound') {
                      highScore = Math.min(highScore, 5);
                    }
                    // หาวันที่เล่นล่าสุด
                    const lastPlayedDate = gameLogs.length > 0 ? new Date(gameLogs[0].createdAt) : null;
                    const lastPlayedStr = lastPlayedDate 
                      ? lastPlayedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) 
                      : '-';
                    return {
                      ...stat,
                      gamesPlayed,
                      highScore,
                      lastPlayed: lastPlayedStr,
                    };
                }));
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchHistory();
  }, [router]);

  // ฟังก์ชันสำหรับคลิกดูประวัติการเล่นเกมนั้นๆ
  const handleGameClick = async (game: GameStat) => {
    setSelectedGame(game);
    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      const res = await fetch(`/api/game/history`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      
      if (data.success) {
        // กรองเฉพาะประวัติเกมที่เลือก
        const filteredHistory = data.history.filter((h: GameHistory) => h.gameType === game.key);
        setGameHistoryDetail(filteredHistory);
      }
    } catch (error) {
      console.error("Failed to load game history detail", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOverview = () => {
    setSelectedGame(null);
    setGameHistoryDetail([]);
  };

  // ✅ 2. ฟังก์ชันกดปุ่มแจ้งเตือน
  const handleEnableNotifications = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      requestNotificationPermission();
      alert("ระบบกำลังขออนุญาตเปิดการแจ้งเตือน... กรุณากด 'อนุญาต' (Allow) ที่มุมจอ");
    } else {
      alert("ไม่พบข้อมูลผู้ใช้");
    }
  };

  const handleLogout = async () => {
    // เคลียร์ข้อมูลทั้งหมด
    localStorage.removeItem('userId'); 
    localStorage.removeItem('profile_username');
    localStorage.removeItem('profile_age');
    localStorage.removeItem('daily_quiz_progress_v2'); 
    
    await fetch('/api/logout', { method: 'POST' });
    
    router.push('/login');
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xl">กำลังโหลดข้อมูล...</div>;
  }

  // ถ้าเลือกเกมแล้ว แสดงหน้าประวัติเกมนั้นๆ
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-sans pb-20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 pt-12 pb-16 px-6 rounded-b-[3rem] shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBackToOverview}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-4 rounded-2xl border-4 border-green-200 shadow-xl font-extrabold text-xl flex items-center gap-3 mb-8 transition-all duration-200 hover:from-green-500 hover:to-emerald-600 hover:scale-105 hover:shadow-2xl ring-2 ring-green-100/60"
            >
              <span className="text-2xl"></span>
              <span>กลับหน้าโปรไฟล์</span>
            </button>
            
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl ${selectedGame.color} bg-white shadow-xl`}>
                {selectedGame.icon}
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-black drop-shadow-lg">{selectedGame.name}</h1>
                <p className="text-blue-100 text-lg font-semibold mt-1">ประวัติการเล่นทั้งหมด</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 -mt-8">
          {/* สถิติรวม */}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border-2 border-white/50 mb-8">
            <div className="flex justify-center gap-20 text-center">
              <div>
                <p className="text-2xl text-black font-bold mb-2">จำนวนครั้ง</p>
                <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedGame.gamesPlayed}
                </p>
              </div>
              <div>
                <p className="text-2xl text-black font-bold mb-2">คะแนนสูงสุด</p>
                <p className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {selectedGame.highScore}
                </p>
              </div>
            </div>
          </div>

          {/* รายการประวัติการเล่น */}
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">📜</span>
              รายการประวัติการเล่น
            </h2>
            
            {gameHistoryDetail.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border-2 border-white/50">
                <span className="text-6xl mb-4 block">🎮</span>
                <p className="text-slate-500 text-lg font-semibold">ยังไม่มีประวัติการเล่น</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gameHistoryDetail.map((history, index) => {
                  const playDate = new Date(history.createdAt);
                  const formattedDate = playDate.toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = playDate.toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={history._id}
                      className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-white/50 hover:border-blue-200 transition-all duration-300 hover:shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-slate-800 font-extrabold text-3xl">คะแนน: <span className="text-4xl text-purple-700 font-extrabold align-middle">{history.score}</span></p>
                            <div className="flex items-center gap-4 text-lg text-slate-600 mt-2">
                              <span className="flex items-center gap-2">
                                <span className="text-xl">📅</span> <span className="font-bold">{formattedDate}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-xl">🕒</span> <span className="font-bold">{formattedTime}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        {history.score === selectedGame.highScore && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-7 py-3 rounded-full font-extrabold text-xl shadow-2xl flex items-center gap-3 drop-shadow-lg scale-110">
                            <span className="text-2xl">🏆</span> สูงสุด
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 font-sans pb-20 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/40 to-blue-50/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-blue-200 via-blue-300 to-blue-100 pt-12 pb-28 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
            
            {/* Avatar */}
            <div className="w-36 h-36 md:w-44 md:h-44 bg-gradient-to-br from-white to-blue-50 rounded-full p-2.5 shadow-2xl relative group">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-7xl md:text-8xl border-4 border-white overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {profile.fruitEmoji || '🍎'}
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-pink-400/20 animate-pulse"></div>
            </div>

            {/* User Info */}
            <div className="text-center md:text-left text-white flex-1">
                <h1 className="text-5xl md:text-6xl font-black mb-3 drop-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">{profile.username || 'ผู้ใช้งาน'}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-50 font-semibold text-base">
                  {profile.age && (
                    <span className="bg-gradient-to-br from-pink-100 via-peach-100 to-pink-200 px-5 py-2.5 rounded-xl border-2 border-pink-400 shadow-lg flex items-center gap-2 text-blue-900 font-bold text-lg transition-all duration-300 hover:border-pink-500 hover:shadow-xl" style={{ minWidth: '120px' }}>
                      <span className="text-xl">🎂</span> อายุ {profile.age} ปี
                    </span>
                  )}
                  <span className="bg-gradient-to-br from-pink-100 via-peach-100 to-pink-200 px-5 py-2.5 rounded-xl border-2 border-pink-400 shadow-lg flex items-center gap-2 text-blue-900 font-bold text-lg transition-all duration-300 hover:border-pink-500 hover:shadow-xl" style={{ minWidth: '160px' }}>
                    <span className="text-xl">📅</span> สมาชิกตั้งแต่ {profile.joinedDate}
                  </span>
                </div>
            </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-300/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-pink-300/20 rounded-full blur-2xl"></div>

        {/* Floating Notification Button (Top Right) */}
        <button 
          onClick={handleEnableNotifications}
          className="absolute top-8 right-8 z-20 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-extrabold text-lg px-7 py-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/50 flex items-center gap-3 group hover:scale-105 active:scale-95"
          style={{ minWidth: 'auto' }}
        >
          <span className="text-2xl animate-bounce">🔔</span>
          <span>รับแจ้งเตือน</span>
        </button>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {statistics.map((stat, index) => (
                <div 
                    key={stat.id} 
                    onClick={() => handleGameClick(stat)}
                    className="bg-white/80 backdrop-blur-lg rounded-3xl p-7 shadow-xl border-2 border-white/50 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group relative overflow-hidden"
                    style={{animationDelay: `${index * 100}ms`}}
                >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${stat.color} shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                                {stat.icon}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">เล่นไปแล้ว</p>
                                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {stat.gamesPlayed}
                                </p>
                                <p className="text-xs font-medium text-slate-400">ครั้ง</p>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-5 group-hover:text-blue-600 transition-colors">{stat.name}</h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100 shadow-sm group-hover:shadow-md transition-all">
                                <span className="text-slate-600 font-semibold text-sm flex items-center gap-2">
                                    <span className="text-xl">🏆</span> คะแนนสูงสุด
                                </span>
                                <span className="text-xl font-black text-green-600 bg-white px-3 py-1 rounded-lg">{stat.highScore}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 shadow-sm group-hover:shadow-md transition-all">
                                <span className="text-slate-600 font-semibold text-sm flex items-center gap-2">
                                    <span className="text-xl">🕒</span> เล่นล่าสุด
                                </span>
                                <span className="text-sm font-bold text-blue-700 bg-white px-3 py-1 rounded-lg">{stat.lastPlayed}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Action Buttons: Removed แจ้งเตือน button from here */}
        <div className="flex flex-row flex-wrap justify-center gap-6 mt-12 w-full">
          <Link 
            href="/welcome" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold text-xl px-12 py-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/50 flex items-center gap-4 group hover:scale-105 active:scale-95"
          >
            <span className="text-3xl transform group-hover:rotate-12 transition-transform">🏠</span> 
            <span>กลับหน้าหลัก</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-extrabold text-xl px-10 py-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white/50 flex items-center gap-4 group hover:scale-105 active:scale-95"
          >
            <span className="text-3xl">🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </div>
    </div>
  )
}
