'use client'

import React from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  // Mock user data
  const user = {
    username: 'ผู้ใช้ทดสอบ',
    email: 'user@example.com',
    age: 65,
    joinDate: '2024-01-15',
    totalGamesPlayed: 42,
    averageScore: 850,
    highScore: 1200,
  }

  const statistics = [
    {
      gameType: 'เกมจับคู่สี',
      gamesPlayed: 12,
      averageScore: 850,
      highScore: 1200,
      lastPlayed: '2024-11-12',
    },
    {
      gameType: 'เกมบวกเลข',
      gamesPlayed: 10,
      averageScore: 920,
      highScore: 1500,
      lastPlayed: '2024-11-11',
    },
    {
      gameType: 'เกมจำลำดับภาพ',
      gamesPlayed: 8,
      averageScore: 780,
      highScore: 950,
      lastPlayed: '2024-11-10',
    },
    {
      gameType: 'เกมฟังเสียงสัตว์',
      gamesPlayed: 7,
      averageScore: 800,
      highScore: 1100,
      lastPlayed: '2024-11-09',
    },
    {
      gameType: 'เกมจำศัพท์',
      gamesPlayed: 5,
      averageScore: 650,
      highScore: 900,
      lastPlayed: '2024-11-08',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← กลับหน้าแรก
          </Link>
          <h1 className="game-title">👤 โปรไฟล์ของฉัน</h1>
        </div>

        {/* User Info Card */}
        <div className="card bg-white mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-3xl font-bold text-primary-700 mb-6">{user.username}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-lg text-primary-500">อีเมล</p>
                  <p className="text-2xl font-bold text-primary-700">{user.email}</p>
                </div>
                <div>
                  <p className="text-lg text-primary-500">อายุ</p>
                  <p className="text-2xl font-bold text-primary-700">{user.age} ปี</p>
                </div>
                <div>
                  <p className="text-lg text-primary-500">วันที่เข้าร่วม</p>
                  <p className="text-2xl font-bold text-primary-700">{user.joinDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-primary-700 mb-6">สถิติทั่วไป</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xl text-primary-600">จำนวนเกมที่เล่น</p>
                  <p className="text-3xl font-bold text-primary-700">{user.totalGamesPlayed}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl text-primary-600">คะแนนเฉลี่ย</p>
                  <p className="text-3xl font-bold text-primary-700">{user.averageScore}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl text-primary-600">คะแนนสูงสุด</p>
                  <p className="text-3xl font-bold text-success-600">{user.highScore}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics by Game */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary-700 mb-6">สถิติแต่ละเกม</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statistics.map((stat, index) => (
              <div key={index} className="card hover:shadow-xl transition-shadow">
                <h3 className="text-2xl font-bold text-primary-700 mb-6">{stat.gameType}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg text-primary-500">เล่นแล้ว</p>
                    <p className="text-2xl font-bold text-primary-700">{stat.gamesPlayed} ครั้ง</p>
                  </div>
                  <div>
                    <p className="text-lg text-primary-500">คะแนนเฉลี่ย</p>
                    <p className="text-2xl font-bold text-primary-700">{stat.averageScore}</p>
                  </div>
                  <div>
                    <p className="text-lg text-primary-500">คะแนนสูงสุด</p>
                    <p className="text-2xl font-bold text-success-600">{stat.highScore}</p>
                  </div>
                  <div>
                    <p className="text-lg text-primary-500">เล่นล่าสุด</p>
                    <p className="text-xl font-bold text-primary-600">{stat.lastPlayed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-col md:flex-row mb-8">
          <Link href="/" className="btn-primary flex-1 text-center">
            กลับไปเล่นเกม
          </Link>
          <button className="btn-secondary flex-1">
            แก้ไขโปรไฟล์
          </button>
          <button className="btn-error flex-1">
            ออกจากระบบ
          </button>
        </div>

        {/* Footer Tips */}
        <div className="card bg-blue-50">
          <h3 className="text-3xl font-bold text-primary-700 mb-4">💡 เคล็ดลับการเล่น</h3>
          <ul className="text-xl text-primary-600 space-y-3">
            <li>✓ เล่นเกมสม่ำเสมอเพื่อผลลัพธ์ที่ดีที่สุด</li>
            <li>✓ พยายามเพิ่มคะแนนเฉลี่ยของคุณทุกวัน</li>
            <li>✓ ทดลองเกมที่แตกต่างกันเพื่อกระตุ้นส่วนต่าง ๆ ของสมอง</li>
            <li>✓ กำหนดเป้าหมายใหม่และพยายามให้ถึง</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
