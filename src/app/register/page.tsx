"use client";

import { useState } from "react";
import Link from 'next/link';

// SVG Icons Components
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-400">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
)
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-400">
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
  </svg>
)
export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        age,
      }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      // ล้างข้อมูลเก่า (ถ้ามี) ก่อนสมัครใหม่
      localStorage.removeItem('profile_username');
      localStorage.removeItem('profile_age');
      localStorage.removeItem('anonId');
      // ล้างสถิติและประวัติทุกเกมของผู้ใช้เดิม
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('stat_color-matching_') ||
          key.startsWith('stat_color-matching_history_') ||
          key.startsWith('stat_fast-math_') ||
          key.startsWith('stat_fast-math_history_') ||
          key.startsWith('stat_sequential-memory_') ||
          key.startsWith('stat_sequential-memory_history_') ||
          key.startsWith('stat_animal-sound_') ||
          key.startsWith('stat_animal-sound_history_') ||
          key.startsWith('stat_vocabulary_') ||
          key.startsWith('stat_vocabulary_history_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      setUsername("");
      setPassword("");
      setAge("");
      // เก็บข้อมูลลง localStorage เพื่อให้ welcome page แสดงไอคอนโปรไฟล์ทันที
      localStorage.setItem('profile_username', data.username || username);
      localStorage.setItem('profile_age', data.age || age);
      if (data.anonId) {
        localStorage.setItem('anonId', data.anonId);
      }
      // ไปหน้าโปรไฟล์ทันทีหลังสมัครสมาชิก
      window.location.replace('/profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-white p-4 font-sans">
      {/* การ์ด Register */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-white relative overflow-hidden">
        {/* ลวดลายตกแต่งพื้นหลังการ์ดจางๆ */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          {/* ส่วนหัว */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-[#1e3a8a] mb-4 tracking-tight">
              สมัครสมาชิก
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              ลงทะเบียนเพื่อเริ่มเล่นเกมฝึกสมอง<br/>และบันทึกสถิติของคุณ
            </p>
          </div>
          {/* ฟอร์ม */}
          <form onSubmit={handleRegister} className="space-y-8 mb-10">
            {/* ช่องกรอกชื่อผู้ใช้ */}
            <div>
              <label htmlFor="username" className="block text-xl font-bold text-slate-700 mb-3 pl-1">
                ชื่อผู้ใช้
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 pl-5 pointer-events-none">
                  <UserIcon />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 text-xl md:text-2xl rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm"
                  placeholder="กรุณาใส่ชื่อผู้ใช้"
                  autoComplete="username"
                />
              </div>
            </div>
            {/* ช่องกรอกรหัสผ่าน */}
            <div>
              <label htmlFor="password" className="block text-xl font-bold text-slate-700 mb-3 pl-1">
                รหัสผ่าน
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 pl-5 pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-5 text-xl md:text-2xl rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm"
                  placeholder="กรุณาใส่รหัสผ่าน 🙈"
                  autoComplete="new-password"
                />
                {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
                <button
                  type="button"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 pr-5 text-blue-400 hover:text-blue-700 focus:outline-none"
                  tabIndex={0}
                >
                  {showPassword ? (
                    // eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0012 15a3 3 0 002.121-5.121M9.88 9.88A3 3 0 0112 9a3 3 0 013 3c0 .795-.312 1.515-.818 2.05M21 12c0 3.866-3.582 7-8 7a8.96 8.96 0 01-6.364-2.636M3.055 9.06A8.963 8.963 0 013 12c0 3.866 3.582 7 8 7 1.657 0 3.21-.406 4.545-1.12" />
                    </svg>
                  ) : (
                    // eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {/* ช่องกรอกอายุ */}
            <div>
              <label htmlFor="age" className="block text-xl font-bold text-slate-700 mb-3 pl-1">
                อายุ
              </label>
              <input
                id="age"
                type="number"
                min="40"
                max="100"
                className="w-full pl-4 pr-4 py-4 text-xl md:text-2xl rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="กรุณาใส่อายุ"
                value={age}
                onChange={e => setAge(e.target.value)}
                required
              />
            </div>
            {/* ปุ่มสมัครสมาชิก */}
            <button
              type="submit"
              className="w-full py-5 rounded-2xl text-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-200/50 hover:-translate-y-1"
            >
              สมัครสมาชิก
            </button>
            {/* ข้อความแจ้งเตือน */}
            {message && (
              <p className="text-center mt-3 text-blue-600 font-semibold">
                {message}
              </p>
            )}
          </form>
          {/* ลิงก์กลับหน้าแรก */}
          <div className="text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 text-slate-500 hover:text-blue-600 font-bold text-lg px-6 py-3 rounded-2xl hover:bg-blue-50 transition-all"
            >
              <span className="text-2xl">←</span> กลับไปหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
