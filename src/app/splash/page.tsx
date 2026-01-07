"use client"

import Link from 'next/link'

export default function SplashPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <div className="flex justify-end w-full mb-2 gap-4">
          <Link href="/login" className="text-sm text-gray-600 flex items-center gap-2 hover:underline">
            <span className="inline-block w-5 h-5 bg-blue-300 rounded-full text-center text-white">👤</span>
            ลงชื่อเข้าใช้
          </Link>
          <Link href="/register" className="text-sm text-gray-600 flex items-center gap-2 hover:underline">
            <span className="inline-block w-5 h-5 bg-green-300 rounded-full text-center text-white">📝</span>
            ลงทะเบียน
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-primary-700 mb-4 text-center">SmartMemory Test</h1>
        <div className="flex justify-center gap-4 mb-6">
          <span className="text-5xl text-orange-500 font-bold">1</span>
          <span className="text-5xl text-yellow-500 font-bold">5</span>
          <span className="text-5xl text-green-500 font-bold">4</span>
          <span className="text-5xl text-blue-500 font-bold">3</span>
        </div>
        <div className="flex justify-center gap-8 mb-6">
          <span className="text-3xl">🧑‍🦳</span>
          <span className="text-3xl">🧠</span>
          <span className="text-3xl">🧑‍🦳</span>
        </div>
        <h2 className="text-2xl font-bold text-primary-600 mb-4 text-center">ฝึกสมองง่ายๆเล่นได้ทุกวัน</h2>
        <Link href="/welcome" className="btn-primary w-full py-3 text-xl font-bold rounded-xl mt-4 text-center">เริ่มเล่น</Link>
      </div>
    </div>
  )
}
