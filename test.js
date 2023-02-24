const test = require('brittle')
const Wallet = require('./index.js')
const Provider = require('ethers-provider')

require('dotenv').config()

const walletAddress = process.env.CONTRACT_WALLET_ADDRESS
const modelAccount = process.env.ACCOUNT_MODEL_ADDRESS
const privateKey = process.env.PRIVATE_KEY
const provider = new Provider({ url: process.env.PROVIDER_URL, chainId: Number(process.env.PROVIDER_CHAINID) })

test('wallet from', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  const account = wallet.from(0)
  t.ok(account)
})

test('account properties', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  const account = wallet.from(0)
  t.is(account.index, 0)
  t.is(account.address, process.env.ACCOUNT_ZERO_ADDRESS)
})

test('account info', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  {
    const account = wallet.from(0)
    const info = await account.info()

    t.is(info.address, account.address)
    t.is(typeof info.exists, 'boolean')
    t.is(info.salt, '0x0000000000000000000000000000000000000000000000000000000000000000')

    t.is(info.address, process.env.ACCOUNT_ZERO_ADDRESS)
  }

  {
    const account = wallet.from(1)
    const info = await account.info()

    t.is(info.address, account.address)
    t.is(typeof info.exists, 'boolean')
    t.is(info.salt, '0x0000000000000000000000000000000000000000000000000000000000000001')
  }
})

test('account balance', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  const account = wallet.from(0)
  // Note: should fund the address to correctly test the values

  const nativeBalance = await account.balance()
  t.is(nativeBalance.units, 0n)
  t.is(nativeBalance.decimals, 18)

  const tokenBalance = await account.balance('0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814')
  t.is(tokenBalance.units, 0n)
  t.is(tokenBalance.decimals, 18)
})

test('account create', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  let account = null

  while (true) {
    account = wallet.from(randomInt())
    const info = await account.info()
    if (!info.exists) break
  }

  const tx = await account.create()
  t.ok(tx.hash)
})

/* test.skip('pass gas limit and price from outside', async function (t) {
  const wallet = new Wallet(walletAddress, { modelAccount, privateKey, provider })

  const gasLimit = await wallet.contract.estimateGas.create(randomInt()) // ~125570
  const feeData = await wallet.provider.getFeeData() // + feeData.maxFeePerGas.mul(gasLimit)
  // + should calculate gasPrice for bnb, eth, and polygon networks
}) */

function randomInt () {
  return Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
}
