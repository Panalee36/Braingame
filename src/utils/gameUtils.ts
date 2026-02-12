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
export const generateColorCards = (difficulty: number) => {
  // สำหรับระดับง่าย (difficulty 1) - 6 คู่ สี
  if (difficulty === 1) {
    const easyColors = [
      { color: '#ef4444', name: 'แดง' },           // Red
      { color: '#22c55e', name: 'เขียว' },         // Green
      { color: '#3b82f6', name: 'น้ำเงิน' },       // Blue
      { color: '#f97316', name: 'ส้ม' },           // Orange
      { color: '#FFE135', name: 'เหลือง' },        // Yellow
      { color: '#8b5cf6', name: 'ม่วง' },          // Violet
    ];

    // สร้างไพ่ 2 ใบต่อสี
    const cards = easyColors.flatMap((c, i) => [
      { id: `c${i}-a`, color: c.color, colorName: c.name },
      { id: `c${i}-b`, color: c.color, colorName: c.name },
    ]);

    // สุ่มลำดับการ์ด
    return cards.sort(() => Math.random() - 0.5);
  }

  // สำหรับระดับยาก (difficulty 2) - 12 คู่ สี
  if (difficulty === 2) {
    const hardColors = [
      { color: '#ef4444', name: 'แดง' },              // Red
      { color: '#003E00', name: 'เขียวเข้ม' },            // Green
      { color: '#3b82f6', name: 'น้ำเงิน' },          // Blue
      { color: '#f97316', name: 'ส้ม' },              // Orange
      { color: '#FFE135', name: 'เหลือง' },           // Yellow
      { color: '#8b5cf6', name: 'ม่วง' },             // Violet
      { color: '#7E481C', name: 'น้ำตาล' },        // Yellow-Orange
      { color: '#FF8FAB', name: 'ชมพู' },      // Blue-Violet
      { color: '#fff5c3', name: 'ส้มแดง' },           // Red-Orange
      { color: '#14b8a6', name: 'เขียวน้ำเงิน' },     // Blue-Green
      { color: '#84cc16', name: 'เขียวเหลือง' },      // Yellow-Green
      { color: '#A9A9A9', name: 'เทา' },          // Red-Violet
    ];

    // สร้างไพ่ 2 ใบต่อสี
    const cards = hardColors.flatMap((c, i) => [
      { id: `c${i}-a`, color: c.color, colorName: c.name },
      { id: `c${i}-b`, color: c.color, colorName: c.name },
    ]);

    // สุ่มลำดับการ์ด
    return cards.sort(() => Math.random() - 0.5);
  }

  // Fallback for any other difficulty (should not reach here)
  return [];
};

export const generateMathQuestion = (difficulty: number) => {
  const level = Math.min(difficulty, 5);
  let min = 1, max = 10;
  if (level === 2) { min = 10; max = 50; }
  if (level === 3) { min = 20; max = 100; }
  if (level === 4) { min = 50; max = 200; }
  if (level === 5) { min = 10; max = 99; }
  const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
  const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
  const correctAnswer = num1 + num2;
  const options = [correctAnswer];
  while (options.length < 4) {
    const wrongAnswer = correctAnswer + (Math.random() - 0.5) * (max * 0.5);
    const rounded = Math.floor(wrongAnswer);
    if (rounded > 0 && !options.includes(rounded)) {
      options.push(rounded);
    }
  }
  return {
    id: `math-${Date.now()}`,
    num1,
    num2,
    operation: '+' as const,
    correctAnswer,
    options: options.sort(() => Math.random() - 0.5),
  };
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
  { label: 'ลิงจริง', image: '/memory-images/sunflower/monkey.jpg' },
  { label: 'ไก่จริง', image: '/images/animal-pictures/chicken.jpg' },
  { label: 'แมวจริง', image: '/memory-images/sunflower/cat.jpg' },
  { label: 'ปลาจริง', image: '/memory-images/sunflower/fish.jpg' },
  { label: 'แอปเปิ้ลจริง', image: '/memory-images/sunflower/apple.jpg' },
  { label: 'ส้มจริง', image: '/memory-images/sunflower/orange.jpg' },
]

// รายชื่อไฟล์รูปจริงใน memory-images/sunflower/ (ตัวอย่าง UUID)
const SUNFLOWER_IMAGES = [
  'daisy',
  'frangipani',
  'kaewmankorn',
  'sapraros',
  'apple',
  'bird',
  'blueberry',
  'butterfly',
  'cat',
  'east-side',
  'elephant',
  'fish',
  'grape',
  'hibiscus',
  'jasmine',
  'leaf',
  'light-blue',
  'lotus',
  'mangosteen',
  'watermelon',
  'monkey',
  'moon',
  'orange',
  'peacock',
  'pomelo',
  'rabbit',
  'rose',
  'sheep',
  'sun',
  'tiger',
  'tomato',
  'tree',
];

export const generateSequentialImages = (difficulty: number, countOverride?: number) => {
  // ใช้รูปจริงทั้งหมดจาก memory-images/sunflower/
  const count = countOverride ?? 6;
  const selectedFiles = SUNFLOWER_IMAGES.sort(() => Math.random() - 0.5).slice(0, count);
  const selected = selectedFiles.map((filename, index) => ({
    id: `img-${index}`,
    imageUrl: `/memory-images/sunflower/${filename}.jpg`,
    label: filename,
    order: index,
    isAsset: true
  }));
  return selected;
}

// Animal Sound Game Utilities

export const ANIMALS = [
  {
    name: "หมา",
    label: "หมา",
    image: "/images/animal-pictures/dog.jpg",
    sound: "/sounds/animal-sound/dog.mp3",
  },
  {
    name: "แมว",
    label: "แมว",
    image: "/images/animal-pictures/cat.jpg",
    sound: "/sounds/animal-sound/cat.mp3",
  },
  {
    name: "วัว",
    label: "วัว",
    image: "/images/animal-pictures/cow.jpg",
    sound: "/sounds/animal-sound/cow.mp3",
  },
  {
    name: "ไก่",
    label: "ไก่",
    image: "/images/animal-pictures/chicken.jpg",
    sound: "/sounds/animal-sound/chicken.mp3",
  },
  {
    name: "เป็ด",
    label: "เป็ด",
    image: "/images/animal-pictures/duck.jpg",
    sound: "/sounds/animal-sound/duck.mp3",
  },
  {
    name: "หมู",
    label: "หมู",
    image: "/images/animal-pictures/pig.jpg",
    sound: "/sounds/animal-sound/pig.mp3",
  },
  {
    name: "แกะ",
    label: "แกะ",
    image: "/images/animal-pictures/sheep.jpg",
    sound: "/sounds/animal-sound/sheep.mp3",
  },
  {
    name: "ม้า",
    label: "ม้า",
    image: "/images/animal-pictures/horse.jpg",
    sound: "/sounds/animal-sound/horse.mp3",
  },
  {
    name: "เสือ",
    label: "เสือ",
    image: "/images/animal-pictures/tiger.jpg",
    sound: "/sounds/animal-sound/tiger.mp3",
  },
  {
    name: "ช้าง",
    label: "ช้าง",
    image: "/images/animal-pictures/elephant.jpg",
    sound: "/sounds/animal-sound/elephant.mp3",
  },
  {
    name: "นก",
    label: "นก",
    image: "/images/animal-pictures/bird.jpg",
    sound: "/sounds/animal-sound/bird.mp3",
  },
  {
    name: "ลิง",
    label: "ลิง",
    image: "/images/animal-pictures/monkey.jpg",
    sound: "/sounds/animal-sound/monkey.mp3",
  },
  {
    name: "ผึ้ง",
    label: "ผึ้ง",
    image: "/images/animal-pictures/bee.jpg",
    sound: "/sounds/animal-sound/bee.mp3",
  },
  {
    name: "จิ้งหรีด",
    label: "จิ้งหรีด",
    image: "/images/animal-pictures/cricket.jpg",
    sound: "/sounds/animal-sound/cricket.mp3",
  },
];

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
      imageUrl: animal.image,
    },
    options: options
      .sort(() => Math.random() - 0.5)
      .map((a, i) => ({
        id: `option-${i}`,
        name: a.label,
        soundUrl: a.sound,
        imageUrl: a.image,
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
  'ขนมปัง',
  'แว่นตา',
  'โทรทัศน์',
  'จักรวาล',
  'สนามเด็กเล่น',
  'ต้นกล้า',
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
  'แก้ว',
  'นาฬิกา',
  'โทรศัพท์',
  'ดอกไม้',
  'โต๊ะ',
  'เก้าอี้',
  'กระเป๋า',
  'รองเท้า',
  'หมวก',
  'เสื้อผ้า',
  'อาหาร',
  'ผลไม้',
  'สนามหญ้า',
  'ฟ้าผ่า',
  'รถยนต์',
  'สนามฟุตบอล',
  'จักรยาน',
  'ต้นสน',
]

export const generateVocabularyWords = (difficulty: number, customCount?: number) => {
  const count = customCount ?? (difficulty > 1 ? 24 : 18)
  const pool = [...VOCABULARY_WORDS].sort(() => Math.random() - 0.5)
  const selected = pool.slice(0, Math.min(count, pool.length)).map((word, index) => ({
    id: `word-${index}`,
    word,
    imageUrl: undefined,
  }))

  return selected
}

export const generateVocabularyOptions = (words: any[], difficulty: number, totalOptions: number = 30) => {
  const options = [...words]
  // Prevent infinite loop: we can only have as many unique options
  // as the vocabulary pool provides. If the requested total exceeds
  // the pool size, cap to the pool size.
  const maxOptions = Math.min(totalOptions, VOCABULARY_WORDS.length)

  while (options.length < maxOptions) {
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
