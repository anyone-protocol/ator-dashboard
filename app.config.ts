const uniswapBaseUrl = 'https://app.uniswap.org'
const dexscreenerBaseUrl = 'https://dexscreener.com/ethereum'

const contracts = {
  relayRegistry: 'kvPua_H71Iwsvx4q-SwAmSMuw7Y9Tj8DyxUIhFKK-JQ',
  erc20: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
  uniswapPair: '0xa7480AAfA8AD2af3ce24Ac6853F960AE6Ac7F0c4'
}

export default defineAppConfig({
  contracts,
  links: {
    dexscreener: `${dexscreenerBaseUrl}/${contracts.uniswapPair}`,
    uniswap: `${uniswapBaseUrl}/#/swap?outputCurrency=${contracts.erc20}`
  }
})