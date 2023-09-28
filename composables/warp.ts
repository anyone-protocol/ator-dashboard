import { LoggerFactory, WarpFactory } from 'warp-contracts'
import { EthersExtension } from 'warp-contracts-plugin-ethers'

export const useWarp = async () => {
  LoggerFactory.INST.logLevel('error')

  const warp = WarpFactory
    .forMainnet()
    .use(new EthersExtension())

  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  /* eslint-disable @typescript-eslint/no-unsafe-call */
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
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  /* eslint-enable @typescript-eslint/ban-ts-comment */
  /* eslint-enable @typescript-eslint/no-unsafe-argument */
  /* eslint-enable @typescript-eslint/no-unsafe-call */

  return warp.use(new EvmSignatureVerificationWebPlugin())
}
