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

  // await initializeAuth()
  initRelayRegistry()
  initAtorToken()
  initDistribution()
  initFacilitator()
  useRelayMetrics().refresh()

  dashboardInitialized = true
}

export const refreshDashboard = async () => {
  const auth = useAuth()

  if (auth.value) {
    useDistribution().refresh()
    useRelayRegistry().refresh()
    const signer = await useSigner()
    const facilitator = useFacilitator()
    const token = useAtorToken()
    if (signer) {
      token.setSigner(signer)
      if (facilitator) { facilitator.setSigner(signer) }
    } else {
      token.setSigner()
      if (facilitator) { facilitator.setSigner() }
    }
  }
}
