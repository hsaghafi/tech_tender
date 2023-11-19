require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")
require("./tasks/block-number")

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/VA-jhTXiIQg8hbssGWIZkYfV1AflA7G-"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    "0x11ee3108a03081fe260ecdc106554d09d9d1209bcafd46942b10e02943effc4a"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          chainId: 31337,
          // gasPrice: 130000000000,
      },
      sepolia: {
          url: SEPOLIA_RPC_URL,
          accounts: [PRIVATE_KEY],
          chainId: 11155111,
          blockConfirmations: 6,
      },
      localhost: {
        url: "http://127.0.0.1:8545/",
        chainId: 31337,
        auto: false,
        // interval: 12000
    },
},
  solidity: {
    compilers: [
        {
            version: "0.8.20",
            settings: {
                viaIR: true,
                optimizer: {
                 enabled: true,
                 runs: 200,
                },
               },
        },
        {
            version: "0.6.6",
        },
    ],
},
etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    // customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
},
gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "MATIC",
},
namedAccounts: {
    deployer: {
        default: 0,
    },
},
};
