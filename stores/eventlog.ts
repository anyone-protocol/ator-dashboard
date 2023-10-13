import { defineStore } from 'pinia'

import { LogLevel } from '~/utils/logger'

type LogMessage = {
  level: LogLevel
  timestamp: number
  source: string
  message: string
}

interface EventlogStoreState {
  logs: LogMessage[]
  filters: {
    error: boolean
    warn: boolean
    info: boolean
    debug: boolean
  }
}

export const useEventlogStore = defineStore('eventlog', {
  state: (): EventlogStoreState => {
    return {
      logs: [],
      filters: {
        error: true,
        warn: true,
        info: true,
        debug: false
      }
    }
  },
  getters: {
    filtered: (state) => state.logs.filter(log => state.filters[log.level])
  },
  actions: {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    append(source: string, level: LogLevel, ...messages: any[]) {
      const timestamp = Date.now()
      const message = messages.reduce<string>((rest, c) => {
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        const currentPart = typeof c === 'object'
          ? JSON.stringify(c)
          : c.toString() || ''
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        /* eslint-enable @typescript-eslint/no-unsafe-call */
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */

        return rest + ' ' + currentPart
      }, '')
      this.logs.push({ source, level, message, timestamp })
    }
  }
})
