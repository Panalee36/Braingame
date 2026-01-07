"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="flex justify-center p-6">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-lg w-80"
      >
        <h1 className="text-2xl font-bold text-center mb-4">
          🧠 เกมฝึกสมอง <br /> สมัครสมาชิก
        </h1>

        <label>ชื่อผู้ใช้</label>
        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="กรุณาใส่ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>รหัสผ่าน</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-3"
          placeholder="กรุณาใส่รหัสผ่าน 🙈"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>อายุ</label>
        <input
          type="number"
          className="w-full p-2 border rounded mb-3"
          placeholder="กรุณาใส่อายุ"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-400 text-white rounded-lg mt-3"
        >
          สมัครสมาชิก
        </button>

        {message && (
          <p className="text-center mt-3 text-blue-600 font-semibold">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
