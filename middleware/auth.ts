export default defineNuxtRouteMiddleware(async () => {
  if (process.server) {
    return navigateTo('/')
  }

  const auth = useAuth()
  if (!auth.value) {
    const highlightConnectButton = useHighlightConnectButton()
    
    highlightConnectButton.value = true

    setTimeout(() => highlightConnectButton.value = false, 1000)

    return abortNavigation()
  }
})
