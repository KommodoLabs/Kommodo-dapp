export const Kommodo_Pool_abi = [
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "factory",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "tokenA",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "tokenB",
              "type": "address"
            },
            {
              "internalType": "int24",
              "name": "tickSpacing",
              "type": "int24"
            },
            {
              "internalType": "uint24",
              "name": "fee",
              "type": "uint24"
            },
            {
              "internalType": "uint24",
              "name": "multiplier",
              "type": "uint24"
            }
          ],
          "internalType": "struct IKommodo.CreateParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "liquidityBor",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountCol",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "interest",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borB",
          "type": "uint256"
        }
      ],
      "name": "Adjust",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "liquidityBor",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountCol",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borB",
          "type": "uint256"
        }
      ],
      "name": "Close",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "liquidityBor",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "amountCol",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "interest",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "borB",
          "type": "uint256"
        }
      ],
      "name": "Open",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickLower",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "liquidity",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "amountA",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "amountB",
          "type": "uint128"
        }
      ],
      "name": "Provide",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickLower",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "liquidity",
          "type": "uint128"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "Take",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "int24",
          "name": "tickLower",
          "type": "int24"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "name": "Withdraw",
      "type": "event"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "token0",
              "type": "bool"
            },
            {
              "internalType": "int24",
              "name": "tickBor",
              "type": "int24"
            },
            {
              "internalType": "uint128",
              "name": "liquidityBor",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "borAMax",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "borBMax",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "amountCol",
              "type": "uint128"
            },
            {
              "internalType": "int128",
              "name": "interest",
              "type": "int128"
            }
          ],
          "internalType": "struct IKommodo.AdjustParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "adjust",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int24",
          "name": "",
          "type": "int24"
        }
      ],
      "name": "assets",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "liquidity",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "locked",
          "type": "uint128"
        },
        {
          "internalType": "uint256",
          "name": "feeGrowth0X128",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "feeGrowth1X128",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "borrower",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "liquidityBor",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "amountCol",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "interest",
          "type": "uint128"
        },
        {
          "internalType": "uint256",
          "name": "start",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        },
        {
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "internalType": "int128",
          "name": "liquidity",
          "type": "int128"
        },
        {
          "internalType": "uint128",
          "name": "col",
          "type": "uint128"
        }
      ],
      "name": "checkRequirement",
      "outputs": [
        {
          "internalType": "bool",
          "name": "success",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "token0",
              "type": "bool"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "int24",
              "name": "tickBor",
              "type": "int24"
            },
            {
              "internalType": "uint128",
              "name": "borAMax",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "borBMax",
              "type": "uint128"
            }
          ],
          "internalType": "struct IKommodo.CloseParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "close",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "factory",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "fee",
      "outputs": [
        {
          "internalType": "uint24",
          "name": "",
          "type": "uint24"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "getFee",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "start",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "end",
          "type": "uint256"
        }
      ],
      "name": "getInterest",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        }
      ],
      "name": "getKey",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        }
      ],
      "name": "getLoanEnd",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_factory",
          "type": "address"
        }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "interest",
      "outputs": [
        {
          "internalType": "uint24",
          "name": "",
          "type": "uint24"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int24",
          "name": "",
          "type": "int24"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "lender",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "liquidity",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "locked",
          "type": "uint128"
        },
        {
          "internalType": "uint256",
          "name": "feeGrowth0X128",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "feeGrowth1X128",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "blocknumber",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "token0",
              "type": "bool"
            },
            {
              "internalType": "int24",
              "name": "tickBor",
              "type": "int24"
            },
            {
              "internalType": "uint128",
              "name": "liquidityBor",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "borAMin",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "borBMin",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "colAmount",
              "type": "uint128"
            },
            {
              "internalType": "int128",
              "name": "interest",
              "type": "int128"
            }
          ],
          "internalType": "struct IKommodo.OpenParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "open",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "int24",
              "name": "tickLower",
              "type": "int24"
            },
            {
              "internalType": "uint128",
              "name": "amountA",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "amountB",
              "type": "uint128"
            }
          ],
          "internalType": "struct IKommodo.ProvideParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "provide",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "token0",
          "type": "bool"
        },
        {
          "internalType": "int24",
          "name": "tickBor",
          "type": "int24"
        },
        {
          "internalType": "int128",
          "name": "delta",
          "type": "int128"
        }
      ],
      "name": "setInterest",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "int24",
              "name": "tickLower",
              "type": "int24"
            },
            {
              "internalType": "uint128",
              "name": "liquidity",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "amountMinA",
              "type": "uint128"
            },
            {
              "internalType": "uint128",
              "name": "amountMinB",
              "type": "uint128"
            }
          ],
          "internalType": "struct IKommodo.TakeParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "take",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "amountA",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountB",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tickSpacing",
      "outputs": [
        {
          "internalType": "int24",
          "name": "",
          "type": "int24"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenA",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenB",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenA",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenB",
          "type": "address"
        },
        {
          "internalType": "uint24",
          "name": "poolFee",
          "type": "uint24"
        },
        {
          "internalType": "int24",
          "name": "tickLower",
          "type": "int24"
        },
        {
          "internalType": "int24",
          "name": "tickUpper",
          "type": "int24"
        }
      ],
      "name": "tokensOwed",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "tokensOwed0",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "tokensOwed1",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount0Owed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount1Owed",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "uniswapV3MintCallback",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int24",
          "name": "tickLower",
          "type": "int24"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint128",
          "name": "amount0Requested",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "amount1Requested",
          "type": "uint128"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "int24",
          "name": "",
          "type": "int24"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "withdraws",
      "outputs": [
        {
          "internalType": "uint128",
          "name": "amountA",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "amountB",
          "type": "uint128"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const