import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from './firebase'

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    switch (firebaseError.code) {
      case 'auth/email-already-in-use':
        throw new Error('Email already in use')
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters')
      case 'auth/invalid-email':
        throw new Error('Invalid email address')
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection')
      default:
        throw new Error('Failed to create account. Please try again')
    }
  }
}

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    switch (firebaseError.code) {
      case 'auth/user-not-found':
        throw new Error('User not found')
      case 'auth/wrong-password':
        throw new Error('Wrong password')
      case 'auth/invalid-email':
        throw new Error('Invalid email address')
      case 'auth/user-disabled':
        throw new Error('Account has been disabled')
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later')
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection')
      default:
        throw new Error('Failed to sign in. Please try again')
    }
  }
}

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    switch (firebaseError.code) {
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection')
      default:
        throw new Error('Failed to sign out. Please try again')
    }
  }
}

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser
}

export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback)
}
