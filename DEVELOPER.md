# 🛠️ Developer Guide - คู่มือสำหรับนักพัฒนา

## 📖 บทนำ

คู่มือนี้เป็นหนังสือเอกสารสำหรับนักพัฒนาที่ต้องการแก้ไข ขยาย หรือบำรุงรักษาโปรเจกต์ "เกมฝึกสมอง"

---

## 🏗️ สถาปัตยกรรมโปรเจกต์

### ลำดับชั้นของโฟลเดอร์
```
src/
├── app/                 # Pages & Routes
├── components/          # Reusable Components
├── types/               # TypeScript Types
└── utils/               # Helper Functions
```

### Pattern ที่ใช้
- **Next.js App Router**: ใช้ไฟล์โครงสร้าง
- **Client Components**: ใช้ `'use client'` directive
- **TypeScript**: Strict Mode enabled
- **Tailwind CSS**: Utility-first styling

---

## 🎮 สถาปัตยกรรมเกม

### Game Flow
```
Initialize Game
    ↓
Load Question/Setup
    ↓
Display & Wait Input
    ↓
Check Answer
    ↓
Calculate Score
    ↓
Show Result → Continue or End?
    ↓
Game Over → Show Statistics
```

### Game State Structure
```typescript
interface GameState {
  isStarted: boolean        // เกมเริ่มแล้วหรือไม่
  isCompleted: boolean      // เกมจบแล้วหรือไม่
  score: number             // คะแนนปัจจุบัน
  level: number             // ระดับความยาก
  timeRemaining: number     // เวลาที่เหลือ (วินาที)
  totalTime: number         // เวลาที่ใช้ไป (วินาที)
  mistakes: number          // จำนวนข้อผิด
  hints: number             // จำนวน hint ที่ใช้
}
```

---

## 🔧 วิธีเพิ่มเกมใหม่

### ขั้นตอนที่ 1: สร้างโฟลเดอร์เกม
```bash
mkdir -p src/app/games/[game-name]
```

### ขั้นตอนที่ 2: สร้างไฟล์ Page
```typescript
// src/app/games/[game-name]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GameNameGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState(1)

  const initializeGame = () => {
    // Initialize game logic
    setGameStarted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-4 md:p-8">
      {/* Game UI */}
    </div>
  )
}
```

### ขั้นตอนที่ 3: เพิ่ม Game Utilities
```typescript
// src/utils/gameUtils.ts
export const generateNewGameData = (difficulty: number) => {
  // Generate game data
  return { /* data */ }
}

export const calculateGameScore = (
  correctAnswers: number,
  totalAttempts: number,
  timeSpent: number,
  difficulty: number,
) => {
  // Calculate score
  return score
}
```

### ขั้นตอนที่ 4: เพิ่มลิงก์ในหน้าแรก
```typescript
// src/app/page.tsx
const games = [
  // ... existing games
  {
    id: 'game-name',
    title: 'ชื่อเกม',
    description: 'คำอธิบายเกม',
    icon: '🎮',
    color: 'from-color-400 to-color-400',
  },
]
```

### ขั้นตอนที่ 5: เพิ่มประเภทเกม
```typescript
// src/types/index.ts
export type GameType = 'color-matching' | 'fast-math' | '...' | 'new-game'

export interface NewGameState extends GameState {
  // Add game-specific properties
  customData: string
}
```

---

## 🎨 คำแนะนำ UI/UX

### ขนาดฟอนต์
```css
/* สำหรับผู้สูงอายุ */
body { font-size: 1.125rem; }        /* 18px - ข้อความปกติ */
h1 { font-size: 3rem; }              /* 48px - ชื่อเกม */
h2 { font-size: 2.25rem; }           /* 36px - ส่วนหัวรอง */
button { font-size: 1.5rem; }        /* 24px - ปุ่ม */
```

### ขนาดปุ่ม (Touch-friendly)
```css
button {
  min-height: 60px;      /* ขนาดนิ้วของผู้ใหญ่ */
  min-width: 60px;
  padding: 1rem;
  border-radius: 1rem;
}
```

### สีที่แนะนำ
- **Primary**: Blue (#0ea5e9)
- **Success**: Green (#22c55e)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Light Blue (#f0f9ff)

### Contrast Ratio (WCAG AA)
- ข้อความปกติ: 4.5:1
- ข้อความใหญ่: 3:1
- ใช้ `@apply text-primary-700` สำหรับข้อความเข้ม

---

## 🧪 การทดสอบ

### ทดสอบในเบราว์เซอร์
1. เปิด DevTools (`F12`)
2. ไปที่ "Device Emulation"
3. เลือก "iPad" หรือแท็บเล็ตอื่น ๆ

### ทดสอบ Touch Events
```typescript
// ใน Component
const handleTouch = (e: React.TouchEvent) => {
  console.log('Touch detected:', e.touches.length)
}

<button onTouchStart={handleTouch} />
```

### Unit Tests (สำหรับอนาคต)
```bash
npm install --save-dev jest @testing-library/react
npm run test
```

---

## 🔐 Security Best Practices

### ไม่ควรทำ ❌
```typescript
// ❌ เก็บ secrets ใน code
const API_KEY = "sk_test_123456"

// ❌ Render HTML โดยตรง
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ Trust user input
console.log(window.location.hash) // อาจมี XSS
```

### ควรทำ ✅
```typescript
// ✅ ใช้ environment variables
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

// ✅ Sanitize input
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)

// ✅ Validate ข้อมูล
if (!email.includes('@')) return false
```

---

## 📊 Performance Optimization

### Code Splitting
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
})
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/game-icon.png"
  alt="Game Icon"
  width={200}
  height={200}
  priority
/>
```

### Lazy Loading
```typescript
<button onClick={() => {
  import('./game-module').then(mod => mod.startGame())
}} />
```

---

## 🐛 Debugging

### Browser Console
```javascript
// ดูค่า State
console.log('Score:', score)
console.log('Game State:', gameState)

// ตั้ง Breakpoint
debugger; // Pause execution
```

### Next.js Debugging
```bash
NODE_OPTIONS='--inspect' npm run dev
# เปิด chrome://inspect ใน Chrome
```

### React DevTools
- ติดตั้ง React DevTools extension
- ดู Component Hierarchy
- Inspect Props & State

---

## 📦 Deployment

### Deploy to Vercel (ทางเลือกที่ดี)
```bash
npm install -g vercel
vercel login
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload `out` folder to Netlify
```

### Deploy to Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔄 Continuous Integration (CI/CD)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Check code quality

# Database (เมื่อมี)
npm run db:migrate       # Run migrations
npm run db:seed          # Seed data

# Testing (ในอนาคต)
npm run test             # Run tests
npm run test:watch       # Watch mode

# Utilities
npm run analyze          # Analyze bundle size
npm run type-check       # Check TypeScript
```

---

## 🎯 ฟีเจอร์ที่ต้องการบ่อย

### เพิ่ม Database
```typescript
import prisma from '@/lib/prisma'

const user = await prisma.user.create({
  data: { email: 'user@example.com' }
})
```

### เพิ่ม API Routes
```typescript
// app/api/games/route.ts
export async function POST(request: Request) {
  const data = await request.json()
  // Process
  return Response.json({ success: true })
}
```

### เพิ่ม Authentication
```typescript
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth()
  if (!session) return <Redirect to="/login" />
  // Page content
}
```

---

## 📖 Documentation Templates

### Game Component Template
```typescript
/**
 * Game Component
 * @description Description of the game
 * @difficulty Levels 1-5
 * @targetAge 50+
 */

interface GameProps {
  difficulty: number
  onGameComplete: (score: number) => void
}

export default function GameName({ difficulty, onGameComplete }: GameProps) {
  // Implementation
}
```

### Utility Function Template
```typescript
/**
 * Generate game data
 * @param difficulty - Game difficulty (1-5)
 * @returns Generated data for the game
 * @example
 * const data = generateGameData(2)
 */
export function generateGameData(difficulty: number) {
  // Implementation
}
```

---

## 🚀 Contributing Guidelines

1. **Fork** the project
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Code Standards
- ✅ ใช้ TypeScript
- ✅ Follow ESLint rules
- ✅ เพิ่ม Comments ที่เหมาะสม
- ✅ Test code ก่อน submit
- ✅ Update documentation

---

## 📞 Support & Resources

- **Documentation**: See `README.md` and `INSTALLATION.md`
- **Issues**: Create GitHub Issue
- **Discussions**: Share ideas in Discussions
- **Email**: support@braingames.local

---

## 📝 Changelog

### v1.0.0 (12 Nov 2024)
- ✅ 5 games released
- ✅ Authentication system
- ✅ User profile & statistics
- ✅ Responsive design

### v1.1.0 (Upcoming)
- [ ] Database integration
- [ ] Real audio sounds
- [ ] Social features
- [ ] Daily reminders

---

**Happy Coding! 🚀✨**
