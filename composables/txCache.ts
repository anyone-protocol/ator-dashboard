export class TxCache {
    localStorageKeyPrefix!: string

    constructor() {
        this.localStorageKeyPrefix = 'ar://'
    }
  
    saveTransactionData(txId: string, data: any) {
        const key = this.localStorageKeyPrefix + txId
        const serializedData = JSON.stringify(data)
        localStorage.setItem(key, serializedData)
    }
  
    getTransactionData(txId: string) {
        const key = this.localStorageKeyPrefix + txId
        const serializedData = localStorage.getItem(key)
        if (serializedData) return JSON.parse(serializedData)
        return null
    }
  
    hasTransactionData(txId: string) {
        const key = this.localStorageKeyPrefix + txId
        return !!localStorage.getItem(key)
    }
}

export const useTxCache = () => {
    const txCache = new TxCache()

    return {
        saveTransactionData: txCache.saveTransactionData,
        getTransactionData: txCache.getTransactionData,
        hasTransactionData: txCache.hasTransactionData
    }
}