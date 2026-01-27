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
  // จัดกลุ่มสีตามโทนสี เพื่อไม่ให้สุ่มโทนเดียวกันซ้ำ
  const COLOR_GROUPS = [
    // กลุ่มแดง
    [
      { color: '#ef4444', name: 'แดง' },
      { color: '#fb7185', name: 'แดงสด' },
      { color: '#dc2626', name: 'แดงเข้ม' },
    ],
    // กลุ่มส้ม
    [
      { color: '#f97316', name: 'ส้ม' },
      { color: '#fb923c', name: 'ส้มอ่อน' },
      { color: '#fdba74', name: 'ส้มพีช' },
    ],
    // กลุ่มเหลือง
    [
      { color: '#eab308', name: 'เหลือง' },
      { color: '#fbbf24', name: 'เหลืองทอง' },
      { color: '#fde047', name: 'เหลืองสด' },
    ],
    // กลุ่มเขียวมะนาว
    [
      { color: '#84cc16', name: 'เขียวมะนาว' },
      { color: '#a3e635', name: 'เขียวอ่อน' },
    ],
    // กลุ่มเขียว
    [
      { color: '#22c55e', name: 'เขียว' },
      { color: '#10b981', name: 'เขียวใบไม้' },
      { color: '#34d399', name: 'เขียวสด' },
    ],
    // กลุ่มเขียวมิ้นท์
    [
      { color: '#14b8a6', name: 'เขียวมิ้นท์' },
      { color: '#2dd4bf', name: 'เขียวทะเล' },
      { color: '#5eead4', name: 'เขียวพาสเทล' },
    ],
    // กลุ่มฟ้า
    [
      { color: '#06b6d4', name: 'ฟ้าเข้ม' },
      { color: '#0ea5e9', name: 'ฟ้า' },
      { color: '#38bdf8', name: 'ฟ้าสด' },
    ],
    // กลุ่มน้ำเงิน
    [
      { color: '#3b82f6', name: 'น้ำเงิน' },
      { color: '#60a5fa', name: 'น้ำเงินอ่อน' },
      { color: '#93c5fd', name: 'น้ำเงินพาสเทล' },
    ],
    // กลุ่มม่วงน้ำเงิน
    [
      { color: '#6366f1', name: 'ม่วงน้ำเงิน' },
      { color: '#818cf8', name: 'ม่วงอ่อน' },
    ],
    // กลุ่มม่วง
    [
      { color: '#8b5cf6', name: 'ม่วง' },
      { color: '#a78bfa', name: 'ม่วงสด' },
      { color: '#c4b5fd', name: 'ม่วงพาสเทล' },
    ],
    // กลุ่มม่วงชมพู
    [
      { color: '#a855f7', name: 'ม่วงชมพู' },
      { color: '#c084fc', name: 'ม่วงอมชมพู' },
      { color: '#e879f9', name: 'ม่วงอ่อน' },
    ],
    // กลุ่มชมพูเข้ม
    [
      { color: '#ec4899', name: 'ชมพูเข้ม' },
      { color: '#f472b6', name: 'ชมพู' },
      { color: '#f9a8d4', name: 'ชมพูสด' },
    ],
    // กลุ่มชมพูอ่อน
    [
      { color: '#f43f5e', name: 'ชมพูแดง' },
      { color: '#fb7185', name: 'ชมพูอ่อน' },
      { color: '#fda4af', name: 'ชมพูพาสเทล' },
    ],
  ];

  // จำนวนคู่ที่ต้องการ
  const pairs = difficulty === 2 ? 15 : 10;
  
  // สุ่มเลือกกลุ่มสีโดยไม่ซ้ำ
  const shuffledGroups = [...COLOR_GROUPS].sort(() => Math.random() - 0.5);
  const selectedColors = [];
  const usedGroupIndices = new Set<number>();
  
  // เลือกสีจากแต่ละกลุ่มทีละ 1 สี (เลือกกลุ่มที่ต่างกัน)
  for (let i = 0; i < pairs && i < shuffledGroups.length; i++) {
    const group = shuffledGroups[i];
    // สุ่มเลือก 1 สีจากกลุ่ม
    const randomColor = group[Math.floor(Math.random() * group.length)];
    selectedColors.push(randomColor);
    usedGroupIndices.add(i);
  }
  
  // ถ้ายังไม่ครบจำนวน ให้เลือกจากกลุ่มที่ยังไม่ได้ใช้
  if (selectedColors.length < pairs) {
    for (let i = 0; i < shuffledGroups.length && selectedColors.length < pairs; i++) {
      if (!usedGroupIndices.has(i)) {
        const group = shuffledGroups[i];
        // ถ้ากลุ่มมีสีมากกว่า 1 สี ให้เลือกสีอื่นที่ไม่เหมือนที่เลือกไปก่อนหน้า
        let colorIndex = Math.floor(Math.random() * group.length);
        const randomColor = group[colorIndex];
        selectedColors.push(randomColor);
        usedGroupIndices.add(i);
      }
    }
  }
  
  // ถ้ายังไม่ครบ ให้สุ่มจากทั้งหมด (ควรจะไม่เกิด แต่เพื่อ fallback)
  while (selectedColors.length < pairs) {
    const randomGroupIndex = Math.floor(Math.random() * shuffledGroups.length);
    const group = shuffledGroups[randomGroupIndex];
    const randomColor = group[Math.floor(Math.random() * group.length)];
    selectedColors.push(randomColor);
  }
  
  // สร้างไพ่ 2 ใบต่อสี
  const cards = selectedColors.flatMap((c, i) => [
    { id: `c${i}-a`, color: c.color, colorName: c.name },
    { id: `c${i}-b`, color: c.color, colorName: c.name },
  ]);
  
  // สุ่มลำดับการ์ด
  return cards.sort(() => Math.random() - 0.5);
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
  { label: 'ทานตะวัน', image: '/memory-images/sunflower.jpg' },
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
  'east side',
  'elephant',
  'fish',
  'grape',
  'hibiscus',
  'jasmins',
  'leaf',
  'light blue',
  'lotus',
  'mangosteen',
  'matermelon',
  'monkey',
  'moon',
  'orange',
  'peacock',
  'pomelo',
  'rabbit',
  'rose',
  'sheep',
  'sun',
  'tige',
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
    name: 'หมา',
    label: 'หมา',
    image: '/images/animal pictures/dog.jpg',
    sound: '/sounds/animal-sound/dog.mp3',
  },
  {
    name: 'แมว',
    label: 'แมว',
    image: '/images/animal pictures/cat.jpg',
    sound: '/sounds/animal-sound/cat.mp3',
  },
  {
    name: 'วัว',
    label: 'วัว',
    image: '/images/animal pictures/cow.jpg',
    sound: '/sounds/animal-sound/cow.mp3',
  },
  {
    name: 'ไก่',
    label: 'ไก่',
    image: '/images/animal pictures/chicken.jpg',
    sound: '/sounds/animal-sound/chicken.mp3',
  },
  {
    name: 'เป็ด',
    label: 'เป็ด',
    image: '/images/animal pictures/duck.jpg',
    sound: '/sounds/animal-sound/duck.mp3',
  },
  {
    name: 'หมู',
    label: 'หมู',
    image: '/images/animal pictures/pig.jpg',
    sound: '/sounds/animal-sound/pig.mp3',
  },
  {
    name: 'แกะ',
    label: 'แกะ',
    image: '/images/animal pictures/sheep.jpg',
    sound: '/sounds/animal-sound/sheep.mp3',
  },
  {
    name: 'ม้า',
    label: 'ม้า',
    image: '/images/animal pictures/horse.jpg',
    sound: '/sounds/animal-sound/horse.mp3',
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
