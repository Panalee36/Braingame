// User and Authentication Types
export interface User {
  id: string
  username: string
  email?: string
  age?: number
  createdAt: Date
  lastLogin: Date
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// Game Related Types
export type GameType = 'color-matching' | 'fast-math' | 'sequential-memory' | 'animal-sound' | 'vocabulary'

export interface GameScore {
  id: string
  userId: string
  gameType: GameType
  score: number
  difficulty: number
  duration: number
  date: Date
  correctAnswers: number
  totalAttempts: number
}

export interface GameStatistics {
  gameType: GameType
  totalGames: number
  averageScore: number
  highScore: number
  totalTimeSpent: number
  lastPlayed: Date
  successRate: number
}

export interface UserProfile {
  userId: string
  totalGamesPlayed: number
  totalScore: number
  averageScore: number
  statistics: GameStatistics[]
  joinDate: Date
  lastActivityDate: Date
}

// Game-specific types
export interface ColorCard {
  id: string
  color: string
  displayName: string
  isFlipped: boolean
  isMatched: boolean
}

export interface MathQuestion {
  id: string
  num1: number
  num2: number
  operation: '+' | '-' | '*'
  correctAnswer: number
  options: number[]
}

export interface SequentialImageItem {
  id: string
  imageUrl: string
  label: string
  order: number
}

export interface AnimalSound {
  id: string
  name: string
  soundUrl: string
  imageUrl: string
}

export interface VocabularyWord {
  id: string
  word: string
  imageUrl?: string
}

// Game State Types
export interface GameState {
  isStarted: boolean
  isCompleted: boolean
  score: number
  level: number
  timeRemaining: number
  totalTime: number
  mistakes: number
  hints: number
}

export interface ColorMatchingGameState extends GameState {
  cards: ColorCard[]
  flippedCards: ColorCard[]
  matchedPairs: number
}

export interface FastMathGameState extends GameState {
  currentQuestion: MathQuestion | null
  questionsAnswered: number
  correctAnswers: number
  totalQuestions: number
}

export interface SequentialMemoryGameState extends GameState {
  images: SequentialImageItem[]
  displayedImages: SequentialImageItem[]
  selectedOrder: SequentialImageItem[]
  showImages: boolean
}

export interface AnimalSoundGameState extends GameState {
  currentAnimal: AnimalSound | null
  options: AnimalSound[]
  soundPlayed: boolean
  questionsAnswered: number
}

export interface VocabularyGameState extends GameState {
  displayedWords: VocabularyWord[]
  hiddenWords: VocabularyWord[]
  selectionOptions: VocabularyWord[]
  selectedWords: VocabularyWord[]
  correctSelections: number
}
