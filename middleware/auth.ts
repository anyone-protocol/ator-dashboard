export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) {
    return navigateTo('/')
  }

  const auth = useAuth()
  if (!auth.value) {
    const highlightConnectButton = useHighlightConnectButton()
    
    highlightConnectButton.value = true

    setTimeout(() => highlightConnectButton.value = false, 2000)

    return navigateTo('/')
  }
})
