import { defineStore } from 'pinia'

type LogMessageType = 'info' | 'error'

type LogMessage = {
  type: LogMessageType
  timestamp: number
  message: string
}

interface EventlogStoreState {
  logs: LogMessage[]
}

export const useEventlogStore = defineStore('eventlog', {
  state: (): EventlogStoreState => { return { logs: [] } },
  getters: {},
  actions: {
    async append(type: LogMessageType, ...messages: any[]) {
      const timestamp = Date.now()
      const message: string = messages.reduceRight((p, c, i) => {
        return c + ' ' + p.toString()
      }, '')
      this.logs.push({ type, message, timestamp })
    }
  }
})
