import mitt from 'mitt'

import {
  AllocationUpdatedEvent,
  TokenBalanceUpdatedEvent
} from '~/composables'

type Events = {
  'AllocationUpdated': AllocationUpdatedEvent,
  'TokenBalanceUpdated': TokenBalanceUpdatedEvent
}

const eventBus = mitt<Events>()

declare module '#app' {
  interface NuxtApp {
    $eventBus: typeof eventBus
  }
}

export default defineNuxtPlugin(() => {
  return { provide: { eventBus } }
})
