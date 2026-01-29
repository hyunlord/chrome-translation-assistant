// Firebase Module Exports
export {
  initializeFirebase,
  getAuthInstance,
  getFirestoreInstance,
  isFirebaseConfigured,
} from './config'

export {
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthChange,
  isSignedIn,
} from './auth'

export {
  syncTranslation,
  getTranslationsFromCloud,
  deleteTranslationFromCloud,
  syncLocalToCloud,
  getSyncStatus,
  performFullSync,
  type SyncableTranslation,
} from './sync'
