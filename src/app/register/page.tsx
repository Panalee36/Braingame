'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')

  const handleRegister = () => {
    // TODO: Implement actual registration
    console.log('Register:', { username, email, password, age })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card text-center mb-8">
          <h1 className="text-5xl font-bold text-primary-700 mb-4">🧠 เกมฝึกสมอง</h1>
          <h2 className="text-3xl font-bold text-primary-600 mb-8">สมัครสมาชิก</h2>

          <div className="space-y-6 mb-8">
            <div>
              <label className="label-text">ชื่อผู้ใช้</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="กรุณาใส่ชื่อผู้ใช้"
              />
            </div>

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

            <div>
              <label className="label-text">อายุ</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input-field"
                placeholder="กรุณาใส่อายุ"
              />
            </div>
          </div>

          <button onClick={handleRegister} className="btn-primary w-full mb-4">
            สมัครสมาชิก
          </button>

          <p className="text-lg text-primary-600 mb-4">
            มีบัญชีแล้ว?{' '}
            <Link href="/login" className="font-bold text-primary-700 hover:text-primary-800">
              เข้าสู่ระบบ
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
