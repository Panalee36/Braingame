// ฟังก์ชันสำหรับบันทึกประวัติการเล่นเกมแต่ละครั้ง (ทุกเกม)
export function saveGameHistory(gameKey: string, score: number) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `stat_${gameKey}_history`;
  let history: Array<{score: number, date: string}> = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) history = JSON.parse(raw);
  } catch {}
  history.push({ score, date: today });
  localStorage.setItem(key, JSON.stringify(history));
}
// Helper สำหรับเพิ่มรูปภาพจริงเข้า pool
export function addMemoryImage(label: string, filename: string) {
  OBJECTS_FOR_MEMORY.push({ label, image: `/memory-images/${filename}` });
}
// Utility functions for game logic

// Color Matching Game Utilities
const COLORS = [
  { name: 'แดง', hex: '#EF4444', displayName: 'Red' },
  { name: 'เขียว', hex: '#22C55E', displayName: 'Green' },
  { name: 'เหลือง', hex: '#FBBF24', displayName: 'Yellow' },
  { name: 'น้ำเงิน', hex: '#3B82F6', displayName: 'Blue' },
  { name: 'ม่วง', hex: '#A855F7', displayName: 'Purple' },
  { name: 'ส้ม', hex: '#F97316', displayName: 'Orange' },
  { name: 'ชมพู', hex: '#EC4899', displayName: 'Pink' },
  { name: 'ฟ้า', hex: '#06B6D4', displayName: 'Cyan' },
  { name: 'น้ำตาล', hex: '#92400E', displayName: 'Brown' },
  { name: 'เทา', hex: '#6B7280', displayName: 'Gray' },
  { name: 'แข็งชะตา', hex: '#10B981', displayName: 'Emerald' },
  { name: 'กรม', hex: '#1F2937', displayName: 'Dark' },
  { name: 'ชมพูขาด', hex: '#F472B6', displayName: 'Rose' },
  { name: 'ลิ่มทอง', hex: '#D97706', displayName: 'Amber' },
]

export const generateColorCards = (difficulty: number) => {
  // difficulty 1 (Normal) = 10 pairs (20 cards), difficulty 2 (Hard) = 14 pairs (28 cards)
  const pairCount = difficulty === 1 ? 10 : 14
  const selectedColors = COLORS.slice(0, pairCount)
  const cards = []
  let id = 0

  selectedColors.forEach((color) => {
    for (let i = 0; i < 2; i++) {
      cards.push({
        id: `color-${id++}`,
        color: color.hex,
        displayName: color.name,
        isFlipped: false,
        isMatched: false,
      })
    }
  })

  return cards.sort(() => Math.random() - 0.5)
}

// Math Game Utilities
export const generateMathQuestion = (difficulty: number) => {
  const level = Math.min(difficulty, 5)
    let min = 1, max = 10;
    if (level === 2) { min = 10; max = 50; }
    if (level === 3) { min = 20; max = 100; }
    if (level === 4) { min = 50; max = 200; }
    if (level === 5) { min = 10; max = 99; } // ด่าน 5 ใช้เลขหลักสิบ
    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;

  const correctAnswer = num1 + num2
  const options = [correctAnswer]

  // Generate wrong answers
  while (options.length < 4) {
      const wrongAnswer = correctAnswer + (Math.random() - 0.5) * (max * 0.5)
    const rounded = Math.floor(wrongAnswer)
    if (rounded > 0 && !options.includes(rounded)) {
      options.push(rounded)
    }
  }

  return {
    id: `math-${Date.now()}`,
    num1,
    num2,
    operation: '+' as const,
    correctAnswer,
    options: options.sort(() => Math.random() - 0.5),
  }
}

// Sequential Memory Game Utilities
const OBJECTS_FOR_MEMORY = [
  // Emoji ชุดเดิม
  { label: 'ส้ม', emoji: '🍊' },
  { label: 'แมว', emoji: '🐱' },
  { label: 'แอปเปิ้ล', emoji: '🍎' },
  { label: 'บ้าน', emoji: '🏠' },
  { label: 'รถยนต์', emoji: '🚗' },
  { label: 'ดอกไม้', emoji: '🌸' },
  { label: 'ดวงอาทิตย์', emoji: '☀️' },
  { label: 'ดวงจันทร์', emoji: '🌙' },
  { label: 'ดาว', emoji: '⭐' },
  { label: 'เครื่องบิน', emoji: '✈️' },
  // Emoji ชุดใหม่
  { label: 'กล้วย', emoji: '🍌' },
  { label: 'มะนาว', emoji: '🍋' },
  { label: 'แตงโม', emoji: '🍉' },
  { label: 'สับปะรด', emoji: '🍍' },
  { label: 'หมู', emoji: '🐷' },
  { label: 'สุนัข', emoji: '🐶' },
  { label: 'ลิง', emoji: '🐵' },
  { label: 'ไก่', emoji: '🐔' },
  { label: 'ปลา', emoji: '🐟' },
  { label: 'นก', emoji: '🐦' },
  { label: 'เต่า', emoji: '🐢' },
  { label: 'ช้าง', emoji: '🐘' },
  { label: 'ม้า', emoji: '🐴' },
  { label: 'แกะ', emoji: '🐑' },
  { label: 'เป็ด', emoji: '🦆' },
  // รูปภาพจริง (asset)
  { label: 'ลิงจริง', image: '/memory-images/monkey.jpg' },
  { label: 'ไก่จริง', image: '/memory-images/chicken.jpg' },
  { label: 'แมวจริง', image: '/memory-images/cat.jpg' },
  { label: 'ปลาจริง', image: '/memory-images/fish.jpg' },
  { label: 'รถจริง', image: '/memory-images/car.jpg' },
  { label: 'บ้านจริง', image: '/memory-images/house.jpg' },
  { label: 'ดอกไม้จริง', image: '/memory-images/flower.jpg' },
  { label: 'แอปเปิ้ลจริง', image: '/memory-images/apple.jpg' },
  { label: 'ส้มจริง', image: '/memory-images/orange.jpg' },
  { label: 'กล้วยจริง', image: '/memory-images/banana.jpg' },
  { label: 'ภาพถ่าย', image: '/memory-images/photo' },
  { label: 'ดอกเดซี่', image: '/memory-images/photo' },
]

export const generateSequentialImages = (difficulty: number) => {
  // สุ่มเฉพาะ emoji เท่านั้น ไม่ใช้รูปภาพ asset
  const count = Math.min(4 + difficulty, 8)
  const pool = OBJECTS_FOR_MEMORY.filter(obj => obj.emoji)
  const selectedObjs = pool.sort(() => Math.random() - 0.5).slice(0, count)
  const selected = selectedObjs.map((obj, index) => ({
    id: `img-${index}`,
    imageUrl: obj.emoji,
    label: obj.label,
    order: index,
    isAsset: false
  }))
  return selected
}

// Animal Sound Game Utilities
const ANIMALS = [
  { name: 'หมา', sound: '🐕', label: 'หมา' },
  { name: 'แมว', sound: '🐱', label: 'แมว' },
  { name: 'วัว', sound: '🐄', label: 'วัว' },
  { name: 'ไก่', sound: '🐔', label: 'ไก่' },
  { name: 'เป็ด', sound: '🦆', label: 'เป็ด' },
  { name: 'อีกาน', sound: '🐷', label: 'หมู' },
  { name: 'แกะ', sound: '🐑', label: 'แกะ' },
  { name: 'ม้า', sound: '🐴', label: 'ม้า' },
]

export const generateAnimalSounds = () => {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const options = [animal]

  while (options.length < 4) {
    const candidate = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    if (!options.find((a) => a.name === candidate.name)) {
      options.push(candidate)
    }
  }

  return {
    currentAnimal: {
      id: `animal-${Date.now()}`,
      name: animal.name,
      soundUrl: animal.sound,
      imageUrl: animal.sound,
    },
    options: options
      .sort(() => Math.random() - 0.5)
      .map((a, i) => ({
        id: `option-${i}`,
        name: a.label,
        soundUrl: a.sound,
        imageUrl: a.sound,
      })),
  }
}

// Vocabulary Game Utilities
const VOCABULARY_WORDS = [
  'ส้ม',
  'หนังสือ',
  'บ้าน',
  'รถยนต์',
  'ดอกไม้',
  'ทะเล',
  'ภูเขา',
  'ลม',
  'น้ำ',
  'ไฟ',
  'ต้นไม้',
  'นก',
  'ปลา',
  'ต้นสน',
  'ดวงอาทิตย์',
  'ดวงจันทร์',
  'ดาว',
  'เครื่องบิน',
  'รถไฟ',
  'เรือ',
  'แม่น้ำ',
  'หิมะ',
  'ฝน',
  'ฟ้าผ่า',
  'สวน',
  'สนามหญ้า',
]

export const generateVocabularyWords = (difficulty: number) => {
  const count = difficulty > 1 ? 24 : 18
  const pool = [...VOCABULARY_WORDS].sort(() => Math.random() - 0.5)
  const selected = pool.slice(0, Math.min(count, pool.length)).map((word, index) => ({
    id: `word-${index}`,
    word,
    imageUrl: undefined,
  }))

  return selected
}

export const generateVocabularyOptions = (words: any[], difficulty: number) => {
  const options = [...words]
  // Prevent infinite loop: we can only have as many unique options
  // as the vocabulary pool provides. If the requested total exceeds
  // the pool size, cap to the pool size.
  const totalOptions = Math.min(24, VOCABULARY_WORDS.length)

  while (options.length < totalOptions) {
    const candidate = VOCABULARY_WORDS[Math.floor(Math.random() * VOCABULARY_WORDS.length)]
    // Keep options unique until we reach the capped total
    if (!options.find((w) => w.word === candidate)) {
      options.push({
        id: `option-${options.length}`,
        word: candidate,
        imageUrl: undefined,
      })
    } else {
      // If all unique words are already included, break to avoid a tight loop
      // (this happens when words already cover the entire vocabulary pool)
      if (new Set(options.map((w) => w.word)).size >= VOCABULARY_WORDS.length) {
        break
      }
    }
  }

  return options.sort(() => Math.random() - 0.5)
}

// Scoring Utilities
export const calculateScore = (
  correctAnswers: number,
  totalAttempts: number,
  timeSpent: number,
  difficulty: number,
) => {
  const baseScore = correctAnswers * (10 + difficulty * 2)
  const accuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0
  const accuracyBonus = accuracy > 0.8 ? 50 : accuracy > 0.6 ? 30 : 0
  const speedBonus = timeSpent < 60 ? 50 : timeSpent < 120 ? 25 : 0

  return Math.round(baseScore + accuracyBonus + speedBonus)
}

// Difficulty Level Manager
export const getDifficultyLevel = (totalGamesPlayed: number) => {
  if (totalGamesPlayed < 5) return 1
  if (totalGamesPlayed < 15) return 2
  if (totalGamesPlayed < 30) return 3
  if (totalGamesPlayed < 50) return 4
  return 5
}

// Time Limit Utilities
export const getTimeLimit = (gameType: string, difficulty: number) => {
  const baseTime: { [key: string]: number } = {
    'color-matching': 180,
    'fast-math': 300,
    'sequential-memory': 300,
    'animal-sound': 300,
    'vocabulary': 600,
  }

  const time = baseTime[gameType] || 300
  return Math.max(60, time - difficulty * 30)
}
