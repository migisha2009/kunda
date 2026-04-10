// Firebase connection test utility
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

export const testFirebaseConnection = () => {
  console.log('🔍 Testing Firebase Configuration...')
  console.log('📋 Config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    apiKeyLength: firebaseConfig.apiKey?.length,
    projectId: firebaseConfig.projectId
  })

  // Check if all required config is present
  const requiredFields = ['apiKey', 'projectId', 'appId']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase config:', missingFields)
    return false
  }

  try {
    // Test Firebase initialization
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    
    console.log('✅ Firebase initialized successfully')
    console.log('✅ Auth initialized:', !!auth)
    console.log('✅ Firestore initialized:', !!db)
    
    return true
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error)
    return false
  }
}

export const checkEnvironmentVariables = () => {
  console.log('🌍 Checking environment variables...')
  const envVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  }

  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: Set`)
    } else {
      console.error(`❌ ${key}: Missing`)
    }
  })

  return Object.values(envVars).every(Boolean)
}
