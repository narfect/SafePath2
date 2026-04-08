import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

// Firebase configuration
// TODO: Replace with your actual Firebase config
// Get this from: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyAUKV3xY1_UtcW6b7u9CSCtPqh81dgQ4pw",
  authDomain: "safepath-2006.firebaseapp.com",
  projectId: "safepath-2006",
  storageBucket: "safepath-2006.firebasestorage.app",
  messagingSenderId: "1014121644845",
  appId: "1:1014121644845:web:5871b3c60d3039035cc9a4",
  databaseURL: "https://safejourney-2006-default-rtdb.firebaseio.com"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const realtimeDb = getDatabase(app)

export default app

