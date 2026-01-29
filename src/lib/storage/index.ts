// Storage module exports
export {
  TranslationCache,
  getTranslationCache,
  initializeCache,
} from './cacheManager'

export {
  ChromeLocalStorage,
  ChromeSyncStorage,
  localStorage,
  syncStorage,
  addStorageListener,
  removeStorageListener,
  type StorageChangeListener,
} from './chromeStorage'
