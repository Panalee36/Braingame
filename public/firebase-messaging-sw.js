importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyCwy8__FO0VK2fILXmyKltBKlfb2VzxU28",
  authDomain: "daily-game-notification.firebaseapp.com",
  projectId: "daily-game-notification",
  storageBucket: "daily-game-notification.firebasestorage.app",
  messagingSenderId: "442637117284",
  appId: "1:442637117284:web:95529665fd5cc52b2e7c71"
})

const messaging = firebase.messaging()