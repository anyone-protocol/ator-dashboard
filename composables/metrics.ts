import Arweave from 'arweave'
import ArDB from 'ardb'
import ArdbTransaction from 'ardb/lib/models/transaction'

const arweave = new Arweave({
  protocol: 'https',
  host: 'arweave.net',
  port: '443'
})
const ardb = new ArDB(arweave)

export interface ValidationStats {
  consensus_weight: number
  consensus_weight_fraction: number
  observed_bandwidth: number
  verification: {
    failed: number
    running: number
    unclaimed: number
    verified: number
  }
  verified_and_running: {
    consensus_weight: number
    consensus_weight_fraction: number
    observed_bandwidth: number
  }
}

export const useValidationStats = async () => {
  const { arweave, ator } = useAppConfig()
  const tx: ArdbTransaction | null = await ardb
    .search('transactions')
    .from(ator.metricsDeployer)
    .tags([
      { name: 'Protocol', values: 'ator' },
      { name: 'Entity-Type', values: 'validation/stats' }
    ])
    .sort('HEIGHT_DESC')
    .findOne() as ArdbTransaction | null
  
  if (tx) {
    return await $fetch<ValidationStats>(`${arweave.gateway}/${tx.id}`)
  } else {
    console.error('Could not find validation/stats tx')

    return null
  }
}
