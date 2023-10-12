import { useEventlogStore } from '~/stores/eventlog'

const logLevels: { [key: string]: number } = {
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5
}

export default class Logger {
  private level = logLevels[process.env.LOG_LEVEL || 'info']

  constructor(private className: string) {}

  private get prepend() {
    return `[${this.className}]`
  }

  log(...messages: any[]) {
    this.info(...messages)
  }

  info(...messages: any[]) {
    const prepend = `[INFO]${this.prepend}`
    useEventlogStore().append('info', prepend, ...messages)
    if (this.level >= logLevels.info) {
      console.info(prepend, ...messages)
    }
  }

  error(...messages: any[]) {
    const prepend = `[ERROR]${this.prepend}`
    useEventlogStore().append('error', prepend, ...messages)
    if (this.level >= logLevels.error) {
      console.error(prepend, ...messages)
    }
  }

  warn(...messages: any[]) {
    if (this.level >= logLevels.warn) {
      console.warn(`[WARN]${this.prepend}`, ...messages)
    }
  }

  time() {
    console.time(`[TIME]${this.prepend}`)
  }

  timeEnd() {
    console.timeEnd(`[TIME]${this.prepend}`)
  }
}
