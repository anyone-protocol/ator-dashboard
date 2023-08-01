import { Contract } from 'ethers'
import BigNumber from 'bignumber.js'

import { abi } from './AirTor.json'

export class AtorToken {
  constructor(private contract: Contract) {}

  async getBalance(address: string): Promise<string> {
    const balance = await this.contract.balanceOf(address)

    console.log(`AtorToken.getBalance(${address})`, balance)

    return BigNumber(balance).toString()
  }
}

export const useAtorToken = async () => {
  const config = useRuntimeConfig()
  const provider = useProvider()
  if (!provider) { return null }

  try {
    const contract = new Contract(
      config.public.goerliAtorTokenContract,
      abi,
      provider
    )

    return new AtorToken(contract)
  } catch (error) {
    console.error(
      'There was an error connecting to the ATOR Token Contract',
      error
    )

    return null
  }
}
