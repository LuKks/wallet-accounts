const ethers = require('ethers')
const ABI_WALLET = require('./abi/wallet.js')
const ABI_GENERIC_TOKEN = require('./abi/generic-token.js')
const predictDeterministicAddress = require('predict-deterministic-address')

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

module.exports = class Wallet {
  constructor (contractAddress, opts = {}) {
    if (!opts.privateKey) throw new Error('Private key is required to access the Wallet contract')
    if (!opts.provider) throw new Error('Provider is required')
    if (!opts.modelAccount) throw new Error('Model account address is required')

    this.provider = opts.provider
    this.signer = new ethers.Wallet(opts.privateKey, this.provider)
    this.contract = new ethers.Contract(contractAddress, ABI_WALLET, this.signer)
    this.modelAccount = opts.modelAccount
  }

  async info () {
    return {
      modelAccount: await this.contract.modelAccount()
    }
  }

  from (index) {
    return new Account(index, this)
  }
}

class Account {
  constructor (index, wallet) {
    this.index = index
    this.wallet = wallet

    this.address = predictDeterministicAddress(this.wallet.modelAccount, numberToUint256(this.index), this.wallet.contract.address)
  }

  async info () {
    const index = ethers.BigNumber.from(this.index.toString()).toString()

    const info = await this.wallet.contract.get(index)

    return {
      address: info[0],
      exists: info[1],
      salt: info[2]
    }
  }

  async balance (assetAddress) {
    const { address } = await this.info()

    if (isZeroAddress(assetAddress)) {
      const units = await this.wallet.provider.getBalance(address)
      return { units: units.toBigInt(), decimals: 18 }
    }

    const token = new ethers.Contract(assetAddress, ABI_GENERIC_TOKEN, this.wallet.provider)
    const units = await token.balanceOf(address)
    const decimals = await token.decimals()

    return { units: units.toBigInt(), decimals }
  }

  async create (opts) {
    const index = ethers.BigNumber.from(this.index.toString()).toString()

    return this.wallet.contract.create(index, { ...opts })
  }

  async transfer ({ recipient, assetAddress, units }, opts) {
    const index = ethers.BigNumber.from(this.index.toString()).toString()
    units = ethers.BigNumber.from(units.toString()).toString()

    if (isZeroAddress(assetAddress)) assetAddress = ZERO_ADDR

    return this.wallet.contract.transfer(index, recipient, assetAddress, units, { ...opts })
  }

  async swap ({ method, router, unitsIn, unitsOutMin, path, to }, opts) {
    const index = ethers.BigNumber.from(this.index.toString()).toString()
    method = ethers.BigNumber.from(method.toString()).toString()
    unitsIn = ethers.BigNumber.from(unitsIn.toString()).toString()
    unitsOutMin = ethers.BigNumber.from(unitsOutMin.toString()).toString()

    return this.wallet.contract.swap(index, method, router, unitsIn, unitsOutMin, path, to, { ...opts })
  }
}

function numberToUint256 (value) {
  const hex = value.toString(16)
  return '0x' + '0'.repeat(64 - hex.length) + hex
}

function isZeroAddress (addr) {
  return !addr || addr === ZERO_ADDR
}
