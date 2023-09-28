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

export const initializeDashboard = () => {
  if (dashboardInitialized) { return }

  /* eslint-disable @typescript-eslint/no-floating-promises */
  initRelayRegistry()
  initAtorToken()
  initDistribution()
  initFacilitator()
  useRelayMetrics().refresh()
  /* eslint-enable @typescript-eslint/no-floating-promises */

  dashboardInitialized = true
}

export const refreshDashboard = async () => {
  const auth = useAuth()

  if (auth.value) {
    /* eslint-disable @typescript-eslint/no-floating-promises */
    useDistribution().refresh()
    useRelayRegistry().refresh()
    /* eslint-enable @typescript-eslint/no-floating-promises */
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
