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
]

export const generateColorCards = (difficulty: number) => {
  const pairCount = Math.min(4 + difficulty, 8)
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
  const maxNum = level === 1 ? 9 : level === 2 ? 19 : level === 3 ? 49 : level === 4 ? 99 : 999
  const num1 = Math.floor(Math.random() * maxNum) + 1
  const num2 = Math.floor(Math.random() * maxNum) + 1

  const correctAnswer = num1 + num2
  const options = [correctAnswer]

  // Generate wrong answers
  while (options.length < 4) {
    const wrongAnswer = correctAnswer + (Math.random() - 0.5) * (maxNum * 0.5)
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
]

export const generateSequentialImages = (difficulty: number) => {
  const count = Math.min(4 + difficulty, 8)
  const selected = OBJECTS_FOR_MEMORY.slice(0, count)
    .sort(() => Math.random() - 0.5)
    .map((obj, index) => ({
      id: `img-${index}`,
      imageUrl: obj.emoji,
      label: obj.label,
      order: index,
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
]

export const generateVocabularyWords = (difficulty: number) => {
  const count = Math.min(3 + difficulty, 6)
  const selected = VOCABULARY_WORDS.slice(0, count)
    .sort(() => Math.random() - 0.5)
    .map((word, index) => ({
      id: `word-${index}`,
      word,
      imageUrl: undefined,
    }))

  return selected
}

export const generateVocabularyOptions = (words: any[], difficulty: number) => {
  const options = [...words]
  const totalOptions = Math.min(6 + difficulty, 10)

  while (options.length < totalOptions) {
    const candidate = VOCABULARY_WORDS[Math.floor(Math.random() * VOCABULARY_WORDS.length)]
    if (!options.find((w) => w.word === candidate)) {
      options.push({
        id: `option-${options.length}`,
        word: candidate,
        imageUrl: undefined,
      })
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
