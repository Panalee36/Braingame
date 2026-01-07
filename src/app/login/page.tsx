'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 💡 เพิ่มสถานะสำหรับจัดการ Loading
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async () => {
    // 1. ป้องกันการส่งซ้ำและเริ่มโหลด
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    try {
      // 2. Trim username และ debug log
      const usernameTrimmed = username.trim();
      console.log('LOGIN DEBUG: username sent =', JSON.stringify(usernameTrimmed));
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameTrimmed, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 3. บันทึกข้อมูลเฉพาะผู้ที่ login สำเร็จ (รองรับ response ใหม่)
        const user = data.user || {};
        localStorage.setItem('profile_username', user.username || usernameTrimmed);
        localStorage.setItem('profile_age', user.age ? String(user.age) : '');
        localStorage.setItem('anonId', user.anonId || `anon_${usernameTrimmed}`);

        // 4. ตั้งค่า JWT token ใน cookie (สมมติว่า backend ส่งมาใน response header/body)
        if (data.token) {
            document.cookie = `token=${data.token}; path=/; max-age=86400; secure; HttpOnly=true; SameSite=Lax`;
        }

        router.push('/welcome');
      } else {
        // 5. แสดง Error
        setError(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      // 6. จัดการ Error การเชื่อมต่อ
      console.error("Login API Error:", err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง');
    } finally {
      // 7. สิ้นสุดการโหลด
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Card Style */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl text-center">
          
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2">🧠 เกมฝึกสมอง</h1>
          <h2 className="text-3xl font-bold text-blue-600 mb-8">เข้าสู่ระบบ</h2>

          <div className="space-y-6 mb-6">
            <div>
              <label htmlFor="username" className="label-text block text-left text-lg font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl transition duration-150"
                placeholder="กรุณาใส่ชื่อผู้ใช้"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label-text block text-left text-lg font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl transition duration-150"
                placeholder="กรุณาใส่รหัสผ่าน"
                onKeyDown={(e) => {
                    // อนุญาตให้กด Enter เพื่อเข้าสู่ระบบ
                    if (e.key === 'Enter') {
                        handleLogin();
                    }
                }}
              />
            </div>
          </div>
          
          {/* ⚠️ แสดง Error Message ที่ปรับปรุงแล้ว */}
          {error && (
            <div className="text-center text-lg text-red-600 bg-red-100 p-3 rounded-xl mb-4 border border-red-500 font-medium">
              ❌ {error}
            </div>
          )}

          {/* 🚀 ปุ่มเข้าสู่ระบบ */}
          <button
            type="button"
            className={`w-full py-3 text-xl font-bold rounded-xl transition duration-300 
                        ${isLoading 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            onClick={handleLogin}
            disabled={isLoading} // ปิดการใช้งานปุ่มขณะโหลด
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
          
          {/* ปุ่มกลับหน้าแรก */}
          <Link href="/" className="block mt-4 text-center text-blue-600 hover:text-blue-800 text-lg font-medium transition duration-150">
            ← กลับหน้าแรก
          </Link>
          
          {/* สามารถเพิ่ม Link สมัครสมาชิกที่นี่ได้ */}
          {/* <Link href="/register" className="block mt-2 text-center text-gray-500 hover:text-gray-700 text-md">
            ยังไม่มีบัญชี? สมัครสมาชิกที่นี่
          </Link> */}
          
        </div>
      </div>
    </div>
  )
}