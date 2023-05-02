import Bundlr from '@bundlr-network/client'
import { WarpFactory, defaultCacheOptions } from 'warp-contracts'
import Arweave from 'arweave'

const ANT = 'PspdulWYOoBov3dJyA9TdXuqDqaV7snSiwPjtesLvNU'
const DEPLOY_FOLDER = './.output/public'
const BUNDLR_NODE = 'https://node2.bundlr.network'

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
})

const jwk = JSON.parse(
  Buffer.from(process.env.PERMAWEB_KEY, 'base64').toString('utf-8')
)

const bundlr = new Bundlr(BUNDLR_NODE, 'arweave', jwk)
const warp = WarpFactory.custom(
  arweave,
  defaultCacheOptions,
  'mainnet'
).useArweaveGateway().build()
const contract = warp.contract(ANT).connect(jwk)

// upload folder
const result = await bundlr.uploadFolder(DEPLOY_FOLDER, {
  indexFile: 'index.html'
})

// update ANT
await contract.writeInteraction({
  function: 'setRecord',
  subDomain: '@',
  transactionId: result.id
})

console.log('Deployed!  Please wait 20 - 30 minutes for ArNS to update!')
