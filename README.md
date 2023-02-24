# wallet-accounts

Wallet with sub-accounts as a smart contract

```
npm i wallet-accounts
```

It allows generating account addresses without deploying any contract (doesn't spend on fees).\
It doesn't require native balance (ETH or BNB) to transfer tokens from the accounts.

## Usage
```javascript
const Wallet = require('wallet-accounts')
const Provider = require('ethers-provider')

const CONTRACT_WALLET_ADDRESS = '<contract wallet address>'
const modelAccount = '<model account address from wallet contract>'
const privateKey = '<private key with access to wallet contract>'
const provider = new Provider({ name: 'bnb', url: 'https://bsc-dataseed.binance.org' })

const wallet = new Wallet(CONTRACT_WALLET_ADDRESS, { modelAccount, privateKey, provider })

const account = wallet.from(0)
console.log(account.address) // => i.e. deposit address address

const account2 = wallet.from(1)
console.log(account2.address) // => i.e. another deposit address address

const info = await account.info() // => { address, exists, salt }
const balance = await account.balance() // => { units, decimals }

// Manually create the account
const tx = await account.create()

// Or automatically created on transfer() or swap()
const txTransfer = await account.transfer({ recipient, assetAddress, units })
const txSwap = await account.swap({ method, router, unitsIn, unitsOutMin, path, to })
```

## Setup

First deploy [`contracts/Wallet.sol`](contracts/Wallet.sol) to get `contractWalletAddress`.\
Later read the contract using `Remix` or just use `wallet.info()` to get the `modelAccount` address.

## API

#### `const wallet = new Wallet(contractWalletAddress, [options])`

Makes a wallet instance to manage sub accounts.

Available `options`:
```js
{
  modelAccount,
  privateKey,
  provider
}
```

#### `const info = await wallet.info()`

Retrieves useful information for the initial setup.

Returns like so:
```js
{
  modelAccount: '0x4580c2c8501552f2B984d8e99b2fa58753D7F81E'
}
```

#### `const account = wallet.from(index)`

Derives an account from an index.

#### `account.index`

Indicates the index integer of the account.

#### `account.address`

Indicates the deterministically predicted address of the account.

#### `const info = await account.info()`

Returns like so:
```js
{
  address: '0xb6Cd220D141dA74A2e1516A8ae7867aFc2dDEE90',
  exists: false,
  salt: '0x0000000000000000000000000000000000000000000000000000000000000000'
}
```

#### `const info = await account.balance([assetAddress])`

Returns the native or token balance of the account.

If `assetAddress` is empty or the zero address then it returns the native balance.

Returns like so:
```js
{
  units: 0n, // BigInt
  decimals: 18
}
```

#### `const tx = await account.create()`

Deploys the account contract. Normally not needed because it's auto created on demand.

#### `const tx = await account.transfer({ recipient, assetAddress, units })`

Makes a native transfer (ETH, BNB, etc) or a token transfer.

If `assetAddress` is empty or the zero address then it does a native transfer.

#### `const tx = await account.swap({ method, router, unitsIn, unitsOutMin, path, to })`

Makes a swap on the choosen router address using the `IUniswapV2Router02` interface.

Available `method` list:\
`0` for `swapExactTokensForTokens`\
`1` for `swapExactTokensForETH`\
`2` for `swapExactETHForTokens`

## License
MIT
