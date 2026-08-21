import { useState, useEffect, useCallback } from 'react'

/**
 * Read a cookie by name
 */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * Set a cookie with options (expires, path, etc.)
 */
function setCookie(name: string, value: string, days = 365, path = '/') {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`
}

/**
 * Custom hook to store a JSON object in cookies
 */
export function useObjectCookie<T>(key: string, fallback?: T | null): [T | null, (newVal: T) => void] {
  const [value, setValue] = useState<T | null>(() => {
    if (typeof window === 'undefined') return fallback ?? null
    try {
      const cookieVal = getCookie(key)
      return cookieVal ? JSON.parse(cookieVal) : fallback ?? null
    } catch {
      return fallback ?? null
    }
  })

  const updateValue = useCallback(
    (newVal: T) => {
      try {
        setCookie(key, JSON.stringify(newVal))
        setValue(newVal)
      } catch {
        // Optionally handle error here
      }
    },
    [key]
  )

  // Sync cookie changes made outside React (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const cookieVal = getCookie(key)
        if (!cookieVal) {
          if (value !== fallback) setValue(fallback ?? null)
          return
        }
        const parsed = JSON.parse(cookieVal)
        // Simple deep equality check could be improved if needed
        if (JSON.stringify(parsed) !== JSON.stringify(value)) {
          setValue(parsed)
        }
      } catch {
        if (value !== fallback) setValue(fallback ?? null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [key, value, fallback])

  return [value, updateValue]
}
