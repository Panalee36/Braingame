'use client'
import Link from 'next/link'

export default function SplashPage() {
    return (
      <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-[#e0f2fe]">
      {/* --- ส่วนตกแต่งพื้นหลัง (Background Decoration) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-200/50 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[60%] h-[60%] bg-green-100/60 rounded-full blur-3xl"></div>
      </div>

      {/* --- แถบเมนูสมาชิก (ยาวเต็มจอและสมดุล) --- */}
      <div className="relative z-20 bg-blue-50/80 rounded-b-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] w-full px-2 sm:px-6 md:px-10 pt-2 pb-1 flex flex-col border-b border-blue-100">
        {/* ขีดเล็กๆ ด้านล่าง (Handle) ให้รู้ว่าเป็นแถบเลื่อนลงมา */}
        <div className="w-10 h-1 bg-blue-200 rounded-full mx-auto mb-1"></div>
        {/* แถบสมาชิกและปุ่มด้านขวา */}
        <div className="flex flex-row items-end justify-between w-full max-w-5xl mx-auto">
          {/* เส้นแบ่งพร้อมข้อความ */}
          <div className="flex-1 flex items-center gap-2 mb-2">
            <div className="h-[1.5px] bg-blue-100 flex-1"></div>
            <span className="text-blue-600 text-xl md:text-2xl font-extrabold whitespace-nowrap tracking-wide drop-shadow-lg">สำหรับสมาชิก</span>
            <div className="h-[1.5px] bg-blue-100 flex-1"></div>
          </div>
          {/* ปุ่มสมาชิก */}
          <div className="flex flex-row gap-2 mb-1 ml-4">
            <Link 
              href="/login" 
              className="flex flex-row items-center gap-2 px-5 py-2.5 bg-white border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-900 transition-all active:scale-95 shadow text-base font-bold min-w-[120px] justify-center"
            >
              <span className="text-2xl">🔐</span>
              <span className="text-base font-bold">เข้าสู่ระบบ</span>
            </Link>
            <Link 
              href="/register" 
              className="flex flex-row items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 hover:bg-green-100 hover:border-green-400 transition-all active:scale-95 shadow text-base font-bold min-w-[120px] justify-center"
            >
              <span className="text-2xl">📝</span>
              <span className="text-base font-bold">สมัครใหม่</span>
            </Link>
          </div>
        </div>
        {/* เส้นไฮไลท์สีทองอ่อน (เป็นเงาใต้แถบ) */}
        <div className="w-full max-w-5xl mx-auto h-[4px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent rounded-full mt-3 opacity-70 blur-[1.5px]"></div>
      </div>

      {/* --- ส่วนบน: Hero Area (เนื้อหาหลัก) --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pb-10">
        
        {/* โลโก้และไอคอนตกแต่ง */}
        <div className="mb-8 relative">
           <div className="relative z-10 text-[8rem] leading-none drop-shadow-2xl filter hover:scale-105 transition-transform duration-500 cursor-default">
             🧠
           </div>
           {/* ไอคอนลอยตกแต่ง */}
           <div className="absolute -top-4 -right-6 text-6xl animate-bounce" style={{ animationDuration: '2s' }}>💡</div>
           <div className="absolute bottom-2 -left-6 text-5xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>⭐</div>
        </div>

        {/* ชื่อแอป */}
        <div className="text-center mb-10">
           <h1 className="text-5xl md:text-7xl font-black text-blue-900 mb-3 tracking-tight drop-shadow-sm">
             Smart Memory Test
           </h1>
           <div className="inline-block bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50">
             <p className="text-2xl md:text-3xl text-blue-700 font-bold">
             </p>
           </div>
        </div>

        {/* ปุ่มเริ่มเล่น (ปุ่มหลัก ใหญ่และเด่นที่สุด) */}
        <Link 
          href="/welcome" 
          className="group relative w-full max-w-xs md:max-w-sm"
        >
          {/* เงาปุ่มด้านล่าง (ให้ดูนูน) */}
          <div className="absolute inset-0 bg-blue-800 rounded-[2.5rem] translate-y-3 group-hover:translate-y-4 transition-transform rounded-b-[3rem]"></div>
          
          {/* ตัวปุ่ม */}
          <div className="relative bg-gradient-to-b from-blue-400 to-blue-600 p-4 rounded-[2.5rem] border-t-4 border-l-4 border-blue-300 border-r-4 border-b-4 border-blue-700 shadow-2xl flex items-center justify-center gap-4 transform group-hover:translate-y-1 transition-transform cursor-pointer h-24 md:h-28 active:scale-95">
             <div className="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow-inner">
                <span className="text-3xl text-blue-600 ml-1">▶</span>
             </div>
             <span className="text-4xl md:text-5xl font-black text-white tracking-wide drop-shadow-md">
               เริ่มเล่น
             </span>
          </div>
        </Link>
      </div>

      {/* --- (ลบแถบเมนูสมาชิกด้านล่างออก) --- */}

    </div>
  )
}