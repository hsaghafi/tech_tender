import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress, usdt_abi, usdt_contractAddress } from "./constants.js"

// get elements from html page
const connectButton = document.getElementById("connectButton")
const stageLabel = document.getElementById("stageLabel")
const maxprice = document.getElementById("price_max")
const RefreshStageButton = document.getElementById("RefreshStageButton")
const send_prop_hash_Button = document.getElementById("send_prop_hash_Button")
const send_prop_reveal_Button = document.getElementById("send_prop_reveal_Button")
const send_price_hash_Button = document.getElementById("send_price_hash_Button")
const send_price_reveal_Button = document.getElementById("send_price_reveal_Button")
const approve_check_Button = document.getElementById("approve_check_Button")
const withdrawButton = document.getElementById("withdrawButton")
const getWinnerButton = document.getElementById("getWinnerButton")

// assign functions to onclick events
connectButton.onclick = connect
RefreshStageButton.onclick = refreshstage
send_prop_hash_Button.onclick = send_prop_hash
send_prop_reveal_Button.onclick = send_prop_reveal
send_price_hash_Button.onclick = send_price_hash
send_price_reveal_Button.onclick = send_price_reveal
approve_check_Button.onclick = approve_check
withdrawButton.onclick = withdraw
getWinnerButton.onclick = get_winner

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
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
      const accounts = await ethereum.request({ method: "eth_accounts" })
      console.log(accounts[0])
      const acc_string=accounts[0].toString()
      connectButton.innerHTML = acc_string.substring(0,4)+"..."+acc_string.substring(acc_string.length-4)
      refreshstage()
    } else {
      connectButton.innerHTML = "Please install MetaMask"
    }
  }
  
  async function refreshstage() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        let tender_stage = await contract.getStage()
        let tender_maxp = await contract.getMaxPrice()
        maxprice.innerHTML = "Maximum acceptable price (USDT): " + (tender_maxp/(1000000000000000000)).toString()
        if (tender_stage == 1)       // Stage: Initialized
            stageLabel.innerHTML = "Initialized"
        else if (tender_stage == 2)       // Stage: Hashed Proposal Send
            stageLabel.innerHTML = "Hashed Proposal Send"
        else if (tender_stage == 3)       // Stage: Revealed Proposal Send
            stageLabel.innerHTML = "Revealed Proposal Send"
        else if (tender_stage == 4)       // Stage: Review of Proposals
            stageLabel.innerHTML = "Review of Proposals"
        else if (tender_stage == 5)       // Stage: Hashed Price Send
            stageLabel.innerHTML = "Hashed Price Send"
        else if (tender_stage == 6)       // Stage: Revealed Price Send
            stageLabel.innerHTML = "Revealed Price Send"
        else if (tender_stage == 7)       // Stage: Withdraw
            stageLabel.innerHTML = "Withdraw"
        else if (tender_stage == 8)       // Stage: Finished      
            stageLabel.innerHTML = "Finished"
        else if (tender_stage == 0)       // Stage: Unknown      
            stageLabel.innerHTML = "Unknown"
        console.log(tender_stage);
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function send_prop_hash() {
    const prop_hash = document.getElementById("prop_hash").value.toString()
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      const usdt_contract = new ethers.Contract(usdt_contractAddress, usdt_abi, signer)
    try {
      // get Collateral value
      const tender_collat = await contract.getCollateral()
      // approve spending USDT by contract
      console.log(`Approving ${tender_collat} USDT...`)
      const transactionResponse1 = await usdt_contract.approve(contractAddress,tender_collat)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse1, provider)
        console.log("Approved");
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
        return;
      }
      try {
        // call function send_proposal_hash from contract
        const transactionResponse2 = await contract.send_proposal_hash(prop_hash)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse2, provider)
        await transactionResponse2.wait(1)
        console.log("hash of proposal sent");
        window.alert("The hash of your proposal sent successfully.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function send_prop_reveal() {
    const prop_reveal = document.getElementById("prop_reveal").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function send_proposal_reveal from contract
        const transactionResponse = await contract.send_proposal_reveal(prop_reveal)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("proposal sent");
        window.alert("Your proposal sent successfully.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function send_price_hash() {
    const price_hash = document.getElementById("price_hash").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function send_price_hash from contract
        const transactionResponse = await contract.send_price_hash(price_hash)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("hash of price sent");
        window.alert("The hash of your proposed price sent successfully.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function send_price_reveal() {
    const price_reveal = document.getElementById("price_reveal").value
    const price_salt = document.getElementById("price_salt").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function send_price_reveal from contract
        const transactionResponse = await contract.send_price_reveal(price_reveal,price_salt)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("proposed price sent");
        window.alert("Your proposal sent successfully.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function approve_check() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function is_approved from contract
        const approve_status = await contract.is_approved(signer.getAddress())
        console.log("is_approved: "+approve_status);
        if (approve_status)
          window.alert("Congratulations!\n\nYour Proposal accepted.\nYou should send your proposed price in the next stage.")
        else
          window.alert("Unfortunately, your Proposal is not accepted.")
        } catch (error) {
          console.error('Error:', error);
          window.alert("ERROR!\n\nMessage:\n"+error.data.message)
        }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function withdraw from contract
        console.log(`Withdrawing...`)
        const transactionResponse = await contract.withdraw()
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        console.log("Withdrawn!");
        window.alert("Withdrawal Successful!")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function get_winner() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        const winner_address = await contract.getWinner()
        const best_price = await contract.getBestPrice()
        console.log("Winner: "+winner_address+", Best Price: "+best_price+"$");
        window.alert("Winner: "+winner_address+"\n\nBest Price: "+best_price+"$")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`)
    return new Promise((resolve, reject) => {
        try {
            provider.once(transactionResponse.hash, (transactionReceipt) => {
                console.log(`Completed with ${transactionReceipt.confirmations} confirmations.')
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
}

