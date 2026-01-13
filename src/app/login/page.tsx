'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// SVG Icons Components เพื่อความคมชัดและสวยงาม
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-400">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-400">
    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
  </svg>
)

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);

    try {
      const usernameTrimmed = username.trim();
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameTrimmed, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const user = data.user || {};
        localStorage.setItem('profile_username', user.username || usernameTrimmed);
        localStorage.setItem('profile_age', user.age ? String(user.age) : '');
        localStorage.setItem('anonId', user.anonId || `anon_${usernameTrimmed}`);

        if (data.token) {
            document.cookie = `token=${data.token}; path=/; max-age=86400; secure; HttpOnly=true; SameSite=Lax`;
        }
        router.push('/welcome');
      } else {
        setError(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error("Login API Error:", err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-white p-4 font-sans">
      
      {/* การ์ด Login */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_15px_50px_rgba(0,0,0,0.1)] p-8 md:p-12 border border-white relative overflow-hidden">
        
        {/* ลวดลายตกแต่งพื้นหลังการ์ดจางๆ */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
            {/* ส่วนหัวใหม่ (เรียบง่าย สบายตา) */}
            <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-[#1e3a8a] mb-4 tracking-tight">
                เข้าสู่ระบบ
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
                ยินดีต้อนรับกลับครับ<br/>กรุณากรอกข้อมูลเพื่อเริ่มเล่นเกม
            </p>
            </div>

            {/* ฟอร์ม */}
            <form onSubmit={handleLogin} className="space-y-8 mb-10">
            
            {/* ช่องกรอกชื่อผู้ใช้ (พร้อมไอคอน) */}
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
                        className="w-full pl-16 pr-6 py-5 text-xl md:text-2xl rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm"
                        placeholder="ชื่อของคุณ"
                        autoComplete="username"
                    />
                </div>
            </div>
            
            {/* ช่องกรอกรหัสผ่าน (พร้อมไอคอน) */}
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
                  className="w-full pl-16 pr-14 py-5 text-xl md:text-2xl rounded-2xl border-2 border-blue-100 bg-blue-50/30 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm"
                  placeholder="รหัสผ่านของคุณ"
                  autoComplete="current-password"
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

            {/* แสดง Error Message */}
            {error && (
                <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 text-red-600 animate-fade-in shadow-sm">
                <span className="text-3xl">⚠️</span>
                <span className="font-bold text-lg leading-tight">{error}</span>
                </div>
            )}

            {/* ปุ่มเข้าสู่ระบบ */}
            <button
                type="submit"
                disabled={isLoading}
                className={`
                w-full py-5 rounded-2xl text-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 mt-6
                ${isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-200/50 hover:-translate-y-1'}
                `}
            >
                {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังตรวจสอบ...
                </span>
                ) : (
                'เข้าสู่ระบบ'
                )}
            </button>
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
  )
}