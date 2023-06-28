export class TxCache {
    private dbName: string
    private objectStoreName: string
    private keyPrefix: string

    constructor() {
        this.dbName = 'arweaveDataDB'
        this.objectStoreName = 'transactions'
        this.keyPrefix = 'ar://'
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName)

            request.onerror = () => {
                reject(new Error('Failed to open the IndexedDB database'))
            }

            request.onsuccess = () => {
                resolve(request.result as IDBDatabase)
            }

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result as IDBDatabase
                db.createObjectStore(this.objectStoreName)
            }
        })
    }

    public async saveTransactionData(txId: string, data: any): Promise<void | null> {
        try {
            const db = await this.openDB()
            return new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(this.objectStoreName, 'readwrite')
                const objectStore = transaction.objectStore(this.objectStoreName)
                const request = objectStore.put(data, this.keyPrefix + txId)

                request.onerror = () => {
                    reject(new Error('Failed to save transaction data'))
                }
                request.onsuccess = () => {
                    resolve()
                }
            })
        } catch (error) {
            console.error('Failed to save transaction data:', error)
            return null
        }
    }

    public async getTransactionData(txId: string): Promise<any | null> {
        try {
            const db = await this.openDB()
            return new Promise<any>((resolve, reject) => {
                const transaction = db.transaction(this.objectStoreName, 'readonly')
                const objectStore = transaction.objectStore(this.objectStoreName)
                const request = objectStore.get(this.keyPrefix + txId)

                request.onerror = () => {
                    reject(new Error('Failed to get transaction data from IndexedDB'))
                }
                request.onsuccess = () => {
                    resolve(request.result)
                }
            })
        } catch (error) {
            console.error('Failed to get transaction data:', error)
            return null
        }
    }
}

export const useTxCache = () => {
    const txCache = new TxCache()

    return {
        saveTransactionData: txCache.saveTransactionData,
        getTransactionData: txCache.getTransactionData
    }
}
