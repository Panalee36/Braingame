'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export default function ProfilePage() {
  const router = useRouter();
  
  // State ข้อมูลผู้ใช้
  const [profile, setProfile] = useState({
    username: '',
    age: '',
    joinedDate: 'ม.ค. 2567'
  });

  // State สถิติและประวัติ
  const [statistics, setStatistics] = useState<GameStat[]>([
    { id: '1', name: 'เกมจับคู่สี', icon: '🎨', key: 'color-matching', color: 'bg-pink-100 text-pink-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '2', name: 'เกมบวกเลข', icon: '🔢', key: 'fast-math', color: 'bg-blue-100 text-blue-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '3', name: 'เกมจำลำดับภาพ', icon: '🖼️', key: 'sequential-memory', color: 'bg-purple-100 text-purple-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '4', name: 'เกมฟังเสียงสัตว์', icon: '🐕', key: 'animal-sound', color: 'bg-green-100 text-green-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
    { id: '5', name: 'เกมจำศัพท์', icon: '📚', key: 'vocabulary', color: 'bg-yellow-100 text-yellow-600', gamesPlayed: 0, highScore: 0, lastPlayed: '-' },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  // โหลดข้อมูลเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    // 1. โหลดข้อมูล Profile เบื้องต้นจาก localStorage
    const storedUsername = localStorage.getItem('profile_username');
    const storedAge = localStorage.getItem('profile_age');
    if (storedUsername) {
      setProfile(prev => ({
        ...prev,
        username: storedUsername,
        age: storedAge || ''
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
            const res = await fetch(`/api/game/history?userId=${userId}`);
            const data = await res.json();

            if (data.success) {
                const historyData = data.history; // ข้อมูลดิบทั้งหมดจาก DB
                
                // คำนวณสถิติใหม่จากข้อมูลที่ดึงมา
                setStatistics(prevStats => prevStats.map(stat => {
                    // กรองเอาเฉพาะเกมนั้นๆ
                    const gameLogs = historyData.filter((h: any) => h.gameType === stat.key);
                    
                    const gamesPlayed = gameLogs.length;
                    // หาคะแนนสูงสุด (ถ้าไม่มีข้อมูลให้เป็น 0)
                    const highScore = gameLogs.length > 0 
                        ? Math.max(...gameLogs.map((h: any) => Number(h.score))) 
                        : 0;
                    
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
  }, []);

  const handleLogout = () => {
    // เคลียร์ข้อมูลทั้งหมด
    localStorage.removeItem('userId'); 
    localStorage.removeItem('profile_username');
    localStorage.removeItem('profile_age');
    localStorage.removeItem('daily_quiz_progress_v2'); 
    
    // ลบ Cookie Token
    document.cookie = "token=; path=/; max-age=0";
    
    router.push('/login');
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xl">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f0f9ff] font-sans pb-20">
      
      {/* Header Profile Card */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 pt-12 pb-24 px-6 rounded-b-[3rem] shadow-xl relative">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
            
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-2 shadow-2xl">
                <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-6xl border-4 border-blue-50 overflow-hidden">
                    <img 
                        src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${profile.username}`} 
                        alt="User Avatar" 
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* User Info */}
            <div className="text-center md:text-left text-white flex-1">
                <h1 className="text-4xl md:text-5xl font-black mb-2 drop-shadow-md">{profile.username || 'ผู้ใช้งาน'}</h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-blue-100 font-medium text-lg">
                    {profile.age && <span className="bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm">อายุ {profile.age} ปี</span>}
                    <span className="bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm">สมาชิกตั้งแต่ {profile.joinedDate}</span>
                </div>
            </div>

            {/* Logout Button */}
            <button 
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl backdrop-blur-md transition-all font-bold flex items-center gap-2 border border-white/40"
            >
                <span>🚪</span> ออกจากระบบ
            </button>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statistics.map((stat) => (
                <div key={stat.id} className="bg-white rounded-[2rem] p-6 shadow-lg border-2 border-white hover:border-blue-100 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">เล่นไปแล้ว</p>
                            <p className="text-2xl font-black text-slate-700">{stat.gamesPlayed} <span className="text-sm font-normal text-slate-400">ครั้ง</span></p>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{stat.name}</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                            <span className="text-slate-500 font-medium text-sm">🏆 คะแนนสูงสุด</span>
                            <span className="text-lg font-bold text-green-600">{stat.highScore}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                            <span className="text-slate-500 font-medium text-sm">🕒 เล่นล่าสุด</span>
                            <span className="text-sm font-bold text-slate-600">{stat.lastPlayed}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-10">
            <Link 
                href="/welcome" 
                className="bg-white text-blue-600 font-extrabold text-xl px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all border-b-4 border-blue-100 flex items-center gap-3"
            >
                <span>🏠</span> กลับหน้าหลัก
            </Link>
        </div>

      </div>
    </div>
  )
}