const uniswapBaseUrl = 'https://app.uniswap.org'
const dexscreenerBaseUrl = 'https://dexscreener.com/ethereum'

const contracts = {
  relayRegistry: 'R5PXlkYsP5HYVCzGhF9xzZXQqBog3KrRchp47aa5e3w',
  erc20: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
  uniswapPair: '0xa7480AAfA8AD2af3ce24Ac6853F960AE6Ac7F0c4'
}

export default defineAppConfig({
  arweave: {
    gateway: 'https://arweave.net'
  },
  ator: {
    metricsDeployer: 'guDw5nBzO2zTpuYMnxkSpQ2qCQjL8gxB34GjPpZ2qpY'
  },
  contracts,
  links: {
    dexscreener: `${dexscreenerBaseUrl}/${contracts.uniswapPair}`,
    uniswap: `${uniswapBaseUrl}/#/swap?outputCurrency=${contracts.erc20}`
  },
  welcomeDialogUpdated: 1685010992249
})
