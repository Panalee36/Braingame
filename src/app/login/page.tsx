'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    // TODO: Implement actual authentication
    console.log('Login:', { email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card text-center mb-8">
          <h1 className="text-5xl font-bold text-primary-700 mb-4">🧠 เกมฝึกสมอง</h1>
          <h2 className="text-3xl font-bold text-primary-600 mb-8">เข้าสู่ระบบ</h2>

          <div className="space-y-6 mb-8">
            <div>
              <label className="label-text">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="กรุณาใส่อีเมล"
              />
            </div>

            <div>
              <label className="label-text">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="กรุณาใส่รหัสผ่าน"
              />
            </div>
          </div>

          <button onClick={handleLogin} className="btn-primary w-full mb-4">
            เข้าสู่ระบบ
          </button>

          <p className="text-lg text-primary-600 mb-4">
            ยังไม่มีบัญชี?{' '}
            <Link href="/register" className="font-bold text-primary-700 hover:text-primary-800">
              สมัครสมาชิก
            </Link>
          </p>

          <Link href="/" className="btn-secondary w-full text-center">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  )
}
