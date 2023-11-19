import { ethers } from "./ethers-5.6.esm.min.js"
import { usdt_abi, usdt_contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const USDT_mintButton = document.getElementById("USDT_mintButton")
connectButton.onclick = connect
USDT_mintButton.onclick = USDT_mint

window.ethereum.on('accountsChanged', function (accounts) {
  const acc_string=accounts[0].toString()
  console.log(accounts[0])
  connectButton.innerHTML = acc_string.substring(0,4)+"..."+acc_string.substring(acc_string.length-4)
})

async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" })
      } catch (error) {
        console.log(error)
        window.alert("ERROR!\n\nMessage:\n"+error)
      }
      const accounts = await ethereum.request({ method: "eth_accounts" })
      console.log(accounts)
      const acc_string=accounts[0].toString()
      connectButton.innerHTML = acc_string.substring(0,4)+"..."+acc_string.substring(acc_string.length-4)
    } else {
      connectButton.innerHTML = "Please install MetaMask"
    }
  }
  
  async function USDT_mint() {
    const USDT_Amount = document.getElementById("USDT_mintAmount").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const usdt_contract = new ethers.Contract(usdt_contractAddress, usdt_abi, signer)
      console.log(`******Minting ${USDT_Amount} USDT...`)
    try {
        const transactionResponse = await usdt_contract.mint(signer.getAddress(),ethers.utils.parseEther(USDT_Amount))
        await listenForTransactionMine(transactionResponse, provider)
        console.log("Minted!")
        window.alert(USDT_Amount+" USDT Minted Successfully!")
      } catch (error) {
        console.log("Mint Failed...")
        window.alert("ERROR!\n\nMessage:\n"+error)
      }
    } else {
      fundButton.innerHTML = "Please install MetaMask"
    }
  }

  function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`)
    return new Promise((resolve, reject) => {
        try {
            provider.once(transactionResponse.hash, (transactionReceipt) => {
                console.log(
                    `Completed with ${transactionReceipt.confirmations} confirmations. `
                )
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
}

