'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service worker registered successfully:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service worker registration failed:', err)
          })
      })
    }
  }, [])

  return null
}
