import { initializeApp } from "firebase/app"
import { getMessaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyCwy8__FO0VK2fILXmyKltBKlfb2VzxU28",
  authDomain: "daily-game-notification.firebaseapp.com",
  projectId: "daily-game-notification",
  storageBucket: "daily-game-notification.firebasestorage.app",
  messagingSenderId: "442637117284",
  appId: "1:442637117284:web:95529665fd5cc52b2e7c71",
  measurementId: "G-7H25RLD2H6"
}

const app = initializeApp(firebaseConfig)

export const messaging = getMessaging(app)