"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
//ทดสอบ  //game
// Dummy question generators for each game (replace with real logic)
const QUESTION_BANK = {
  "color-matching": (level: number) => ({
    question: `สีอะไรตรงกับหมายเลข ${level}?`,
    options: ["แดง", "น้ำเงิน", "เขียว", "เหลือง"],
    answer: "แดง",
  }),
  "fast-math": (level: number) => ({
    question: `2 + ${level} = ?`,
    options: [String(2+level), String(level), String(level*2), String(level-1)],
    answer: String(2+level),
  }),
  "sequential-memory": (level: number) => ({
    question: `ภาพลำดับที่ ${level} คืออะไร?`,
    options: ["A", "B", "C", "D"],
    answer: "A",
  }),
  "animal-sound": (level: number) => ({
    question: `เสียงสัตว์หมายเลข ${level} คือสัตว์อะไร?`,
    options: ["สุนัข", "แมว", "วัว", "ม้า"],
    answer: "สุนัข",
  }),
  "vocabulary": (level: number) => ({
    question: `คำศัพท์หมายเลข ${level} แปลว่าอะไร?`,
    options: ["บ้าน", "โรงเรียน", "รถยนต์", "ต้นไม้"],
    answer: "บ้าน",
  }),
};

export default function QuizPage({ params }: { params: { gameId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const level = Number(searchParams.get("level")) || 1;
  const gameId = params.gameId;
  const [selected, setSelected] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const questionData = QUESTION_BANK[gameId]?.(level);

  if (!questionData) {
    return <div className="p-8 text-center">ไม่พบคำถามสำหรับเกมนี้</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
      <div className="w-full max-w-xl card p-8">
        <h1 className="text-2xl font-bold mb-4 text-primary-700">ควิส: {gameId}</h1>
        <div className="mb-6 text-xl">{questionData.question}</div>
        <div className="flex flex-col gap-4 mb-6">
          {questionData.options.map((opt) => (
            <button
              key={opt}
              className={`btn ${selected === opt ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelected(opt)}
              disabled={submitted}
            >
              {opt}
            </button>
          ))}
        </div>
        {!submitted ? (
          <button
            className="btn btn-success w-full"
            disabled={!selected}
            onClick={() => setSubmitted(true)}
          >
            ตอบคำถาม
          </button>
        ) : (
          <div className="mt-4 text-lg">
            {selected === questionData.answer ? (
              <span className="text-green-600 font-bold">ถูกต้อง!</span>
            ) : (
              <span className="text-red-600 font-bold">ผิด คำตอบที่ถูกคือ: {questionData.answer}</span>
            )}
            <button
              className="btn btn-primary ml-4"
              onClick={() => router.back()}
            >
              ข้อถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
