/**
 * 极简 IndexedDB 键值封装
 *
 * 为什么不用 localStorage：课程材料与切片会超过 5–10MB，且同步写入阻塞主线程。
 * 这里只做 get/set/del，足够存材料与后续轨迹；不可用时自动降级到 localStorage。
 */

const DB_NAME = 'ai-tutor-db'
const STORE_NAME = 'kv'
const DB_VERSION = 1

let dbPromise = null

function hasIndexedDB() {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function idbGet(key) {
  if (!hasIndexedDB()) return fallbackGet(key)
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return fallbackGet(key)
  }
}

export async function idbSet(key, value) {
  if (!hasIndexedDB()) return fallbackSet(key, value)
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return true
  } catch {
    return fallbackSet(key, value)
  }
}

export async function idbDel(key) {
  if (!hasIndexedDB()) return fallbackDel(key)
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return true
  } catch {
    return fallbackDel(key)
  }
}

/* —— localStorage 降级 —— */

function fallbackGet(key) {
  try {
    const raw = window.localStorage.getItem(`idb:${key}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function fallbackSet(key, value) {
  try {
    window.localStorage.setItem(`idb:${key}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function fallbackDel(key) {
  try {
    window.localStorage.removeItem(`idb:${key}`)
    return true
  } catch {
    return false
  }
}
