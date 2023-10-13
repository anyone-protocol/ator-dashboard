import { ContractUnknownEventPayload, EventLog } from 'ethers'
import { defineStore } from 'pinia'
import BigNumber from 'bignumber.js'

import { useFacilitator } from '~/composables'
import Logger from '~/utils/logger'

const logger = new Logger('FacilitatorStore')

interface ClaimProcess {
  claimNumber: number
  amount?: string
  requestingUpdateTransactionHash?: string
  requestingUpdateBlockTimestamp?: string
  allocationClaimedTransactionHash?: string
  allocationClaimedBlockTimestamp?: string
}

interface FacilitatorStoreState {
  lastQueriedBlockHeight: number
  claims: ClaimProcess[]
}

export const useFacilitatorStore = defineStore('facilitator', {
  state: (): FacilitatorStoreState => {
    return {
      lastQueriedBlockHeight: 0,
      claims: []
    }
  },
  getters: {
    nextClaimNumber: (state) => state.claims.length + 1
  },
  actions: {
    async queryEventsForAuthedUser() {
      const auth = useAuth()
      const facilitator = useFacilitator()

      if (!facilitator) { return }

      if (auth.value?.address) {
        const { address } = auth.value

        const requestingUpdate = await facilitator
          .query('RequestingUpdate', address, this.lastQueriedBlockHeight)
        const allocationClaimed = await facilitator
          .query('AllocationClaimed', address, this.lastQueriedBlockHeight)
        const combined: EventLog[] = [
          ...requestingUpdate as EventLog[],
          ...allocationClaimed as EventLog[]
        ]

        // NB: Sort combined event log by block and tx index ascending
        combined.sort((a, b) => {
          const aVal = parseFloat(`${a.blockNumber}.${a.transactionIndex}`)
          const bVal = parseFloat(`${b.blockNumber}.${b.transactionIndex}`)
          return aVal - bVal
        })

        logger.info('Got claim events for authed user', combined)

        const claims: ClaimProcess[] = []
        let currentClaim: ClaimProcess = { claimNumber: this.nextClaimNumber }
        for (let i = 0; i < combined.length; i++) {
          const log = combined[i]
          const { eventName } = log

          if (
            eventName === 'RequestingUpdate'
            && !currentClaim.requestingUpdateTransactionHash
          ) {
            const block = await log.getBlock()
            const timestamp = new Date(block.timestamp * 1000).toUTCString()
            currentClaim.requestingUpdateTransactionHash = log.transactionHash
            currentClaim.requestingUpdateBlockTimestamp = timestamp
            claims.push(currentClaim)
          } else if (
            eventName === 'AllocationClaimed'
            && !currentClaim.allocationClaimedTransactionHash
          ) {
            const block = await log.getBlock()
            const timestamp = new Date(block.timestamp * 1000).toUTCString()
            const amount = log.args[1] as bigint
            currentClaim.allocationClaimedTransactionHash = log.transactionHash
            currentClaim.allocationClaimedBlockTimestamp = timestamp
            currentClaim.amount = BigNumber(amount.toString())
              .dividedBy(1e18)
              .toFormat(3)
          }

          if (
            currentClaim.requestingUpdateTransactionHash
            && currentClaim.allocationClaimedTransactionHash
          ) {
            // Reset claim loop window
            currentClaim = { claimNumber: this.nextClaimNumber }
          }
        }

        // NB: Reverse claims so they are in descending order
        claims.reverse()
        logger.info('Got claims', claims)
        this.claims = claims

        // TODO -> set lastQueriedBlockHeight
      } else {
        this.$reset()
      }
    },

    // async onRequestingUpdate(requestingUpdate: ContractUnknownEventPayload) {
    //   logger.info('onRequestingUpdate()')

    //   const transactionHash = requestingUpdate.log.transactionHash
    //   const lastClaim = this.claims.at(-1)
    //   if (lastClaim?.requestingUpdateTransactionHash === transactionHash) {
    //     logger.info('onRequestingUpdate() skipping duplicate event')
    //   }

    //   const block = await requestingUpdate.getBlock()
    //   const timestamp = new Date(block.timestamp * 1000).toUTCString()
    //   const claim = {
    //     claimNumber: this.claims.length + 1,
    //     requestingUpdateTransactionHash: transactionHash,
    //     requestingUpdateBlockTimestamp: timestamp
    //   }
      
    //   logger.info('onRequestingUpdate() new claim', claim)
    //   this.claims.push(claim)
    // },

    addPendingClaim(transactionHash: string, blockTimestamp: number) {
      logger.info('addPendingClaim()', transactionHash, blockTimestamp)

      const timestamp = new Date(blockTimestamp * 1000).toUTCString()
      const claim = {
        claimNumber: this.nextClaimNumber,
        requestingUpdateTransactionHash: transactionHash,
        requestingUpdateBlockTimestamp: timestamp          
      }

      const existingClaim = this.claims.find(
        claim => claim.requestingUpdateTransactionHash === transactionHash
      )
      if (existingClaim) {
        logger.info('addPendingClaim() duplicate claim', existingClaim)
      } else {
        this.claims.push(claim)
        logger.info('addPendingClaim() new claim', claim)
      }
    },

    async onAllocationClaimed(
      amount: bigint,
      allocationClaimed: ContractUnknownEventPayload
    ) {
      logger.info('onAllocationClaimed()', amount)
      const claim = this.claims.pop()
      logger.info('onAllocationClaimed() existing claim', claim)
      if (!claim) { return }

      if (claim && !claim.allocationClaimedTransactionHash) {
        const block = await allocationClaimed.getBlock()
        const timestamp = new Date(block.timestamp * 1000).toUTCString()
        claim.allocationClaimedTransactionHash =
          allocationClaimed.log.transactionHash
        claim.allocationClaimedBlockTimestamp = timestamp
        claim.amount = BigNumber(amount.toString())
          .dividedBy(1e18)
          .toFormat(3)

        logger.info('onAllocationClaimed() updated claim', claim)
        this.claims.push(claim)
      }
    }
  }
})
