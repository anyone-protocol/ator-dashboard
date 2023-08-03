import {
  initAtorToken,
  initDistribution,
  initFacilitator,
  initRelayRegistry
} from '~/composables'

let dashboardInitialized = false

export const initializeDashboard = async () => {
  if (dashboardInitialized) { return }

  await initializeAuth()
  initRelayRegistry()
  initAtorToken()
  initDistribution()
  initFacilitator()
  useRelayMetrics().refresh()

  dashboardInitialized = true
}
