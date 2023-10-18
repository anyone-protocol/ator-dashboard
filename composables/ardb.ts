import ArDB from 'ardb'

const arweave = useArweave()
const ardb = new ArDB(arweave)

export const useArdb = () => ardb
