import { createConfig, fallback, unstable_connector/*, http*/ } from 'wagmi'
import { /*mainnet,*/ sepolia, anvil } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'


export const config = createConfig({
  chains: [/*mainnet,*/ sepolia, anvil],
  connectors: [injected()],
  transports: {
    /*
    [mainnet.id]: fallback([
      unstable_connector(injected),
      //http(),
    ]),
    */
    [sepolia.id]: fallback([
      unstable_connector(injected),
      //http(),
    ]),
    [anvil.id]: fallback([
      unstable_connector(injected),
      //http(),
    ]),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}