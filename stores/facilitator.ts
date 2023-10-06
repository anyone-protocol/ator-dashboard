import { EventLog, Log } from 'ethers'
import { defineStore } from 'pinia'
import BigNumber from 'bignumber.js'

import { useFacilitator } from '~/composables'

interface TransactionReceiptLogJSON {
  readonly _type: 'log'
  readonly address: string
  readonly blockHash: string
  readonly blockNumber: number
  readonly data: string
  readonly index: number
  readonly removed: boolean
  readonly topics: string[]
  readonly transactionHash: string
  readonly transactionIndex: number
}

interface TransactionReceiptJSON {
  readonly _type: 'TransactionReceipt'
  readonly blockHash: string
  readonly blockNumber: number
  readonly contractAddress: string | null
  readonly cumulativeGasUsed: string | null
  readonly from: string
  readonly gasPrice: string | null
  readonly gasUsed: string | null
  readonly hash: string,
  readonly index: number,
  readonly logs: TransactionReceiptLogJSON[],
  readonly logsBloom: string,
  readonly root: string | null,
  readonly status: number | null,
  readonly to: string | null
}

interface WithTruncatedTransactionHash { 
  truncatedTranscationHash: string
}

interface ClaimProcess {
  claimNumber: number
  amount: string
  RequestingUpdate: EventLog | null
  AllocationUpdated: EventLog | null
  AllocationClaimed: EventLog | null
  requestedBlockTimestamp: string
  claimedBlockTimestamp: string
}

interface FacilitatorStoreState {
  lastQueriedBlockHeight: number
  claims: ClaimProcess[]
}

function createNewClaimProcess(claimNumber: number) {
  return {
    claimNumber,
    amount: '0',
    RequestingUpdate: null,
    AllocationUpdated: null,
    AllocationClaimed: null,
    requestedBlockTimestamp: '',
    claimedBlockTimestamp: ''
  }
}

export const useFacilitatorStore = defineStore('facilitator', {
  state: (): FacilitatorStoreState => {
    return {
      lastQueriedBlockHeight: 0,
      claims: []
    }
  },
  getters: {},
  actions: {
    async queryEventsForAuthedUser() {
      const auth = useAuth()
      const facilitator = useFacilitator()
      const provider = useProvider()

      if (!facilitator) { return }

      if (auth.value?.address) {
        const { address } = auth.value

        const requestingUpdate = await facilitator.query('RequestingUpdate', address, this.lastQueriedBlockHeight)
        const allocationUpdated = await facilitator.query('AllocationUpdated', address, this.lastQueriedBlockHeight)
        const allocationClaimed = await facilitator.query('AllocationClaimed', address, this.lastQueriedBlockHeight)
        const combined: EventLog[] = [
          ...requestingUpdate as EventLog[],
          ...allocationUpdated as EventLog[],
          ...allocationClaimed as EventLog[]
        ]
        combined.sort((a, b) => {
          const aVal = parseFloat(`${a.blockNumber}.${a.transactionIndex}`)
          const bVal = parseFloat(`${b.blockNumber}.${b.transactionIndex}`)
          return bVal - aVal
        })
        console.log('FacilitatorStore queryEventsForAuthedUser()', combined)

        const claims: ClaimProcess[] = []
        let currentClaim: ClaimProcess = createNewClaimProcess(claims.length)
        for (let i = 0; i < combined.length; i++) {
          const log = combined[i]
          const { eventName } = log

          switch (eventName) {
            case 'RequestingUpdate':
              if (!currentClaim.RequestingUpdate) {
                currentClaim.RequestingUpdate = log
              }
              break
            case 'AllocationUpdated':
              if (!currentClaim.AllocationUpdated) {
                currentClaim.AllocationUpdated = log
              }
              break
            case 'AllocationClaimed':
              if (!currentClaim.AllocationClaimed) {
                currentClaim.AllocationClaimed = log
              }
              break
          }

          if (
            currentClaim.RequestingUpdate
            && currentClaim.AllocationUpdated
            && currentClaim.AllocationClaimed
          ) {
            const requestedBlock = await currentClaim.RequestingUpdate.getBlock()
            currentClaim.requestedBlockTimestamp = new Date(requestedBlock.timestamp * 1000).toUTCString()
            const claimedBlock = await currentClaim.AllocationClaimed.getBlock()
            currentClaim.claimedBlockTimestamp = new Date(claimedBlock.timestamp * 1000).toUTCString()
            const amount = currentClaim.AllocationClaimed.args[1] as bigint
            currentClaim.amount = BigNumber(amount.toString())
              .dividedBy(1e18)
              .toFormat(3)

            claims.push(currentClaim)
            currentClaim = createNewClaimProcess(claims.length)
          }
        }

        console.log('CLAIMS', claims)
        this.claims = claims
        // TODO -> set lastQueriedBlockHeight
      } else {
        this.$reset()
      }
    }
  }
})
