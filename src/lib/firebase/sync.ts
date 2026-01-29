// Firebase Sync Manager
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore'
import { getFirestoreInstance } from './config'
import { getCurrentUser } from './auth'

export interface SyncableTranslation {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  provider: string
  context?: {
    url?: string
    title?: string
    surroundingText?: string
    isPDF?: boolean
    pdfPage?: number
  }
  timestamp: number
  userId: string
  isSynced: boolean
}

/**
 * Sync translation to Firestore
 */
export async function syncTranslation(translation: Omit<SyncableTranslation, 'userId' | 'isSynced'>): Promise<void> {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be signed in to sync')
  }

  const db = getFirestoreInstance()
  const translationRef = doc(db, 'users', user.uid, 'translations', translation.id)

  const syncableTranslation: SyncableTranslation = {
    ...translation,
    userId: user.uid,
    isSynced: true,
  }

  await setDoc(translationRef, syncableTranslation)
  console.log('Translation synced:', translation.id)
}

/**
 * Get translations from Firestore
 */
export async function getTranslationsFromCloud(limitCount: number = 100): Promise<SyncableTranslation[]> {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be signed in to get translations')
  }

  const db = getFirestoreInstance()
  const translationsRef = collection(db, 'users', user.uid, 'translations')
  const q = query(translationsRef, orderBy('timestamp', 'desc'), limit(limitCount))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as SyncableTranslation)
}

/**
 * Delete translation from Firestore
 */
export async function deleteTranslationFromCloud(translationId: string): Promise<void> {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be signed in to delete')
  }

  const db = getFirestoreInstance()
  const translationRef = doc(db, 'users', user.uid, 'translations', translationId)
  await deleteDoc(translationRef)
  console.log('Translation deleted from cloud:', translationId)
}

/**
 * Sync local translations to cloud
 */
export async function syncLocalToCloud(translations: any[]): Promise<number> {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be signed in to sync')
  }

  let syncedCount = 0

  for (const translation of translations) {
    try {
      await syncTranslation(translation)
      syncedCount++
    } catch (error) {
      console.error('Error syncing translation:', translation.id, error)
    }
  }

  return syncedCount
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  localCount: number
  cloudCount: number
  lastSyncTime?: number
}> {
  const user = getCurrentUser()
  if (!user) {
    return {
      localCount: 0,
      cloudCount: 0,
    }
  }

  try {
    const cloudTranslations = await getTranslationsFromCloud()
    const lastSyncTime = await getLastSyncTime()

    return {
      localCount: 0, // Will be filled from Chrome Storage
      cloudCount: cloudTranslations.length,
      lastSyncTime,
    }
  } catch (error) {
    console.error('Error getting sync status:', error)
    return {
      localCount: 0,
      cloudCount: 0,
    }
  }
}

/**
 * Save last sync time
 */
async function saveLastSyncTime(): Promise<void> {
  await chrome.storage.local.set({ lastSyncTime: Date.now() })
}

/**
 * Get last sync time
 */
async function getLastSyncTime(): Promise<number | undefined> {
  const result = await chrome.storage.local.get('lastSyncTime')
  return result.lastSyncTime
}

/**
 * Perform full sync (bidirectional)
 */
export async function performFullSync(): Promise<{
  uploaded: number
  downloaded: number
}> {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('User must be signed in to sync')
  }

  // Get local translations
  const localResult = await chrome.storage.local.get('translationHistory')
  const localTranslations = localResult.translationHistory || []

  // Get cloud translations
  const cloudTranslations = await getTranslationsFromCloud()

  // Create maps for easier lookup
  const localMap = new Map(localTranslations.map((t: any) => [t.id, t]))
  const cloudMap = new Map(cloudTranslations.map((t) => [t.id, t]))

  let uploaded = 0
  let downloaded = 0

  // Upload local translations not in cloud
  for (const local of localTranslations) {
    if (!cloudMap.has(local.id)) {
      try {
        await syncTranslation(local)
        uploaded++
      } catch (error) {
        console.error('Error uploading translation:', local.id, error)
      }
    }
  }

  // Download cloud translations not in local
  const newLocalTranslations = [...localTranslations]
  for (const cloud of cloudTranslations) {
    if (!localMap.has(cloud.id)) {
      newLocalTranslations.push(cloud)
      downloaded++
    }
  }

  // Sort by timestamp
  newLocalTranslations.sort((a, b) => b.timestamp - a.timestamp)

  // Save updated local translations
  await chrome.storage.local.set({ translationHistory: newLocalTranslations.slice(0, 100) })

  // Save sync time
  await saveLastSyncTime()

  console.log(`Sync complete: uploaded ${uploaded}, downloaded ${downloaded}`)

  return { uploaded, downloaded }
}
