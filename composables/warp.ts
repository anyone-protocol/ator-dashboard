import { LoggerFactory, WarpFactory } from 'warp-contracts'
import { EthersExtension } from 'warp-contracts-plugin-ethers'

export const useWarp = async () => {
  LoggerFactory.INST.logLevel('error')

  const warp = WarpFactory
    .forMainnet()
    .use(new EthersExtension())

  if (process.server) {
    const {
      EvmSignatureVerificationServerPlugin
      // @ts-ignore
    } = await import('warp-contracts-plugin-signature/server')

    return warp.use(new EvmSignatureVerificationServerPlugin())
  }

  const {
    EvmSignatureVerificationWebPlugin
    // @ts-ignore
  } = await import('warp-contracts-plugin-signature')

  return warp.use(new EvmSignatureVerificationWebPlugin())
}
