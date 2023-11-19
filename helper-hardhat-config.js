const networkConfig = {
    31337: {
        name: "localhost",
    },
    11155111: {
        name: "sepolia",
        TestUSDT_address: "0xf40568331E5Cc30a1bA49cE86bFEa13Dc1c1C14F",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
