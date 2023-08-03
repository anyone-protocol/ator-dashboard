import {
  initAtorToken,
  initDistribution,
  initFacilitator,
  initRelayRegistry,
  useAtorToken,
  useDistribution,
  useFacilitator,
  useRelayRegistry
} from '~/composables'

let dashboardInitialized = false

export const initializeDashboard = async () => {
  if (dashboardInitialized) { return }

  await setupAuth()
  initRelayRegistry()
  initAtorToken()
  initDistribution()
  initFacilitator()
  useRelayMetrics().refresh()
  const auth = useAuth()
  const atorToken = useAtorToken()
  const facilitator = useFacilitator()
  const distribution = useDistribution()
  const relayRegistry = useRelayRegistry()
  watch(auth, async () => {
    // console.log('auth watch', auth.value)

    if (auth.value) {
      distribution.refresh()
      relayRegistry.refresh()
      const signer = await useSigner()
      if (signer) {
        atorToken.setSigner(signer)
        facilitator.setSigner(signer)
      }
    }
  })

  dashboardInitialized = true
}
