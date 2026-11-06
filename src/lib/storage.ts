/**
 * Safe Browser Storage abstraction layer.
 *
 * Provides SSR-safe, fault-tolerant access to localStorage and sessionStorage.
 * Defends against:
 * 1. SSR environments (typeof window === "undefined")
 * 2. Privacy mode / restricted webviews throwing DOMException / SecurityError
 * 3. QuotaExceededError during high storage usage
 * 4. Corrupt JSON parsing failures
 */

export class SafeStorage {
  private readonly storageType: "localStorage" | "sessionStorage";

  constructor(storageType: "localStorage" | "sessionStorage") {
    this.storageType = storageType;
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window[this.storageType];
    } catch {
      return null;
    }
  }

  /**
   * Read raw string from storage
   */
  getItem(key: string): string | null {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Write raw string to storage
   */
  setItem(key: string, value: string): boolean {
    const storage = this.getStorage();
    if (!storage) return false;
    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): boolean {
    const storage = this.getStorage();
    if (!storage) return false;
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get and parse a JSON value from storage with an optional fallback.
   */
  get<T>(key: string, fallback: T): T;
  get<T>(key: string): T | null;
  get<T>(key: string, fallback: T | null = null): T | null {
    const raw = this.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Serialize and write a value to storage.
   */
  set<T>(key: string, value: T): boolean {
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch {
      return false;
    }
  }
}

export const safeLocalStorage = new SafeStorage("localStorage");
export const safeSessionStorage = new SafeStorage("sessionStorage");
