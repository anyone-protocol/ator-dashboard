const welcomeLastSeenKey = 'welcome-last-seen'

export const useWelcomeLastSeen = () => useState<number | null>(
  welcomeLastSeenKey,
  () => {
    const welcomeLastSeenString = localStorage.getItem(welcomeLastSeenKey)
    const welcomeLastSeen = Number.parseInt(welcomeLastSeenString || '')
    
    if (!Number.isNaN(welcomeLastSeen)) {
      return welcomeLastSeen
    }

    return null
  }
)

export const setWelcomeLastSeen = (welcomeLastSeen: number | null) => {
  const _welcomeLastSeen = useWelcomeLastSeen()
  _welcomeLastSeen.value = welcomeLastSeen
  
  if (welcomeLastSeen) {
    localStorage.setItem(welcomeLastSeenKey, welcomeLastSeen.toString())
  } else {
    localStorage.removeItem(welcomeLastSeenKey)
  }
}

export const useWelcomeDialogOpen = () => useState<boolean>(
  'welcome-dialog-open',
  () => false
)
