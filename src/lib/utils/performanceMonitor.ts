// Performance Monitoring Utility

/**
 * Performance metrics tracker
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private timers: Map<string, number> = new Map()

  /**
   * Start timing an operation
   */
  start(key: string): void {
    this.timers.set(key, performance.now())
  }

  /**
   * End timing and record duration
   */
  end(key: string): number {
    const startTime = this.timers.get(key)
    if (!startTime) {
      console.warn(`No start time found for ${key}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(key)

    // Store metric
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(duration)

    return duration
  }

  /**
   * Get statistics for a metric
   */
  getStats(key: string): {
    count: number
    avg: number
    min: number
    max: number
    total: number
  } | null {
    const values = this.metrics.get(key)
    if (!values || values.length === 0) {
      return null
    }

    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      total: values.reduce((a, b) => a + b, 0),
    }
  }

  /**
   * Get all metrics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    this.metrics.forEach((values, key) => {
      stats[key] = this.getStats(key)
    })

    return stats
  }

  /**
   * Log statistics to console
   */
  logStats(): void {
    const stats = this.getAllStats()
    console.table(stats)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
    this.timers.clear()
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
      }
    }
    return null
  }
}

/**
 * Global performance monitor instance
 */
export const perfMonitor = new PerformanceMonitor()

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  perfMonitor.start(key)
  try {
    const result = await fn()
    const duration = perfMonitor.end(key)
    console.log(`⏱️ ${key}: ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    perfMonitor.end(key)
    throw error
  }
}

/**
 * Measure execution time of a synchronous function
 */
export function measure<T>(key: string, fn: () => T): T {
  perfMonitor.start(key)
  try {
    const result = fn()
    const duration = perfMonitor.end(key)
    console.log(`⏱️ ${key}: ${duration.toFixed(2)}ms`)
    return result
  } catch (error) {
    perfMonitor.end(key)
    throw error
  }
}
