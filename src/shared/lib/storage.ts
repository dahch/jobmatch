const PREFIX = "jobmatch-";

export function getStorageItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(PREFIX + key);
}
