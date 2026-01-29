// Chrome Storage API Wrapper

/**
 * Chrome Local Storage wrapper with type safety
 */
export class ChromeLocalStorage {
  /**
   * Get value from local storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key)
      return result[key] ?? null
    } catch (error) {
      console.error(`Error getting ${key} from local storage:`, error)
      return null
    }
  }

  /**
   * Set value in local storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value })
    } catch (error) {
      console.error(`Error setting ${key} in local storage:`, error)
      throw error
    }
  }

  /**
   * Remove key from local storage
   */
  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key)
    } catch (error) {
      console.error(`Error removing ${key} from local storage:`, error)
      throw error
    }
  }

  /**
   * Clear all local storage
   */
  async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear()
    } catch (error) {
      console.error('Error clearing local storage:', error)
      throw error
    }
  }

  /**
   * Get multiple values
   */
  async getMultiple<T extends Record<string, any>>(
    keys: string[]
  ): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.local.get(keys)
      return result as Partial<T>
    } catch (error) {
      console.error('Error getting multiple values from local storage:', error)
      return {}
    }
  }

  /**
   * Set multiple values
   */
  async setMultiple<T extends Record<string, any>>(values: T): Promise<void> {
    try {
      await chrome.storage.local.set(values)
    } catch (error) {
      console.error('Error setting multiple values in local storage:', error)
      throw error
    }
  }

  /**
   * Get storage usage
   */
  async getBytesInUse(keys?: string | string[]): Promise<number> {
    try {
      return await chrome.storage.local.getBytesInUse(keys)
    } catch (error) {
      console.error('Error getting bytes in use:', error)
      return 0
    }
  }
}

/**
 * Chrome Sync Storage wrapper with type safety
 */
export class ChromeSyncStorage {
  /**
   * Get value from sync storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key)
      return result[key] ?? null
    } catch (error) {
      console.error(`Error getting ${key} from sync storage:`, error)
      return null
    }
  }

  /**
   * Set value in sync storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value })
    } catch (error) {
      console.error(`Error setting ${key} in sync storage:`, error)
      throw error
    }
  }

  /**
   * Remove key from sync storage
   */
  async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove(key)
    } catch (error) {
      console.error(`Error removing ${key} from sync storage:`, error)
      throw error
    }
  }

  /**
   * Clear all sync storage
   */
  async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear()
    } catch (error) {
      console.error('Error clearing sync storage:', error)
      throw error
    }
  }

  /**
   * Get multiple values
   */
  async getMultiple<T extends Record<string, any>>(
    keys: string[]
  ): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.sync.get(keys)
      return result as Partial<T>
    } catch (error) {
      console.error('Error getting multiple values from sync storage:', error)
      return {}
    }
  }

  /**
   * Set multiple values
   */
  async setMultiple<T extends Record<string, any>>(values: T): Promise<void> {
    try {
      await chrome.storage.sync.set(values)
    } catch (error) {
      console.error('Error setting multiple values in sync storage:', error)
      throw error
    }
  }
}

/**
 * Storage event listener
 */
export type StorageChangeListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: 'local' | 'sync' | 'managed'
) => void

export function addStorageListener(listener: StorageChangeListener): void {
  chrome.storage.onChanged.addListener(listener)
}

export function removeStorageListener(listener: StorageChangeListener): void {
  chrome.storage.onChanged.removeListener(listener)
}

// Singleton instances
export const localStorage = new ChromeLocalStorage()
export const syncStorage = new ChromeSyncStorage()
