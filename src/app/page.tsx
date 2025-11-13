'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  const games = [
    {
      id: 'color-matching',
      title: 'เกมจับคู่สี',
      description: 'ฝึกความจำระยะสั้น การสังเกต และสมาธิ',
      icon: '🎨',
      color: 'from-pink-400 to-rose-400',
    },
    {
      id: 'fast-math',
      title: 'เกมบวกเลข',
      description: 'ฝึกการคิดคำนวณ การตัดสินใจ และสมาธิ',
      icon: '🔢',
      color: 'from-yellow-400 to-orange-400',
    },
    {
      id: 'sequential-memory',
      title: 'เกมจำลำดับภาพ',
      description: 'ฝึกความจำระยะสั้นและลำดับเหตุการณ์',
      icon: '🖼️',
      color: 'from-green-400 to-emerald-400',
    },
    {
      id: 'animal-sound',
      title: 'เกมฟังเสียงสัตว์',
      description: 'ฝึกการฟัง และการเชื่อมโยงเสียงกับภาพ',
      icon: '🐕',
      color: 'from-blue-400 to-cyan-400',
    },
    {
      id: 'vocabulary',
      title: 'เกมจำศัพท์',
      description: 'ฝึกความจำด้านภาษา และการเรียกคืนคำศัพท์',
      icon: '📚',
      color: 'from-purple-400 to-violet-400',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-5xl md:text-7xl font-bold text-primary-700 mb-4 animate-slide-up">
          🧠 เกมฝึกสมอง
        </h1>
        <p className="text-2xl md:text-3xl text-primary-600 mb-2">
          ส่งเสริมสุขภาพจิต ลดความเสี่อมของสมอง
        </p>
        <p className="text-xl md:text-2xl text-primary-500">
          เล่นเกมสนุก ๆ เพื่อกระตุ้นสมอง
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 mb-12 flex-wrap justify-center">
        {isLoggedIn ? (
          <>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="btn-primary"
            >
              ออกจากระบบ
            </button>
            <Link href="/profile" className="btn-secondary">
              👤 โปรไฟล์ของฉัน
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-primary">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="btn-secondary">
              สมัครสมาชิก
            </Link>
          </>
        )}
      </div>

      {/* Games Grid */}
      <div className="w-full max-w-6xl">
        <h2 className="game-title">เลือกเกมของคุณ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group"
            >
              <div className="card hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <div className={`bg-gradient-to-r ${game.color} p-8 rounded-xl mb-4 text-center`}>
                  <div className="text-7xl mb-2">{game.icon}</div>
                </div>
                <h3 className="text-3xl font-bold text-primary-700 mb-3 text-center">
                  {game.title}
                </h3>
                <p className="text-xl text-primary-600 text-center mb-4">
                  {game.description}
                </p>
                <div className="text-center pt-4 border-t-2 border-primary-200">
                  <span className="text-xl font-bold text-primary-500 group-hover:text-primary-700">
                    เล่นเลย →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Tips */}
      <div className="w-full max-w-6xl mb-8">
        <div className="card bg-blue-50">
          <h3 className="text-3xl font-bold text-primary-700 mb-4">💡 เคล็ดลับการเล่น</h3>
          <ul className="text-xl text-primary-600 space-y-3">
            <li>✓ เล่นเกมสม่ำเสมอเพื่อผลลัพธ์ที่ดีที่สุด</li>
            <li>✓ เริ่มจากระดับความยากต่ำ แล้วค่อย ๆ เพิ่มขึ้น</li>
            <li>✓ หากรู้สึกเหนื่อย ให้หยุดพักและกลับมาเล่นใหม่</li>
            <li>✓ ตรวจสอบสถิติของคุณเพื่อติดตามความก้าวหน้า</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-lg text-primary-600 mb-8">
        <p>© 2024 เกมฝึกสมองสำหรับผู้สูงอายุ | เพื่อสุขภาพจิตที่ดีขึ้น</p>
      </footer>
    </div>
  )
}
