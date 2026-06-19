export default defineNuxtPlugin(() => {
  if (!import.meta.dev || !('serviceWorker' in navigator)) return

  const cleanupKey = 'nihongo-path-dev-sw-cleaned'

  const cleanupServiceWorkers = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    }

    if (navigator.serviceWorker.controller && sessionStorage.getItem(cleanupKey) !== 'true') {
      sessionStorage.setItem(cleanupKey, 'true')
      window.location.reload()
      return
    }

    sessionStorage.removeItem(cleanupKey)
  }

  cleanupServiceWorkers().catch(() => {})
})
