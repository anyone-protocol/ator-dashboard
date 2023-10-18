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
import { useFacilitatorStore } from '~/stores/facilitator'
import { useMetricsStore } from '~/stores/metrics'

let dashboardInitialized = false

export const initializeDashboard = () => {
  if (dashboardInitialized) { return }

  /* eslint-disable @typescript-eslint/no-floating-promises */
  initRelayRegistry()
  initAtorToken()
  initDistribution()
  initFacilitator()
  useMetricsStore().refresh()
  /* eslint-enable @typescript-eslint/no-floating-promises */

  dashboardInitialized = true
}

export const refreshDashboard = async () => {
  const auth = useAuth()
  const facilitatorStore = useFacilitatorStore()

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
      if (facilitator) {
        await facilitator.setSigner(signer)
        await facilitatorStore.queryEventsForAuthedUser()
      }
    } else {
      token.setSigner()
      if (facilitator) {
        await facilitator.setSigner()
        await facilitatorStore.queryEventsForAuthedUser()
      }
    }
  }
}
