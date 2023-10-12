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
    async append(source: string, level: LogLevel, ...messages: any[]) {
      const timestamp = Date.now()
      const message: string = messages.reduce((rest, c) => {
        const currentPart = typeof c === 'object'
          ? JSON.stringify(c)
          : c.toString()

        return rest + ' ' + currentPart
      }, '')
      this.logs.push({ source, level, message, timestamp })
    }
  }
})
