import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress, usdt_abi, usdt_contractAddress } from "./constants.js"

// get elements from html page
const connectButton = document.getElementById("connectButton")
const stageLabel = document.getElementById("stageLabel")
const RefreshStageButton = document.getElementById("RefreshStageButton")
const setButton = document.getElementById("setButton")
const getParticipantsButton = document.getElementById("getParticipantsButton")
const get_proposalButton = document.getElementById("get_proposalButton")
const approveButton = document.getElementById("approveButton")
const rejectButton = document.getElementById("rejectButton")
const ResetButton = document.getElementById("ResetTenderButton")
const ApproveResetButton = document.getElementById("ApproveForcedResetButton")
const CancelResetButton = document.getElementById("CancelForcedResetButton")
const ForcedResetButton = document.getElementById("ForcedResetButton")
const getWinnerButton = document.getElementById("getWinnerButton")
const autoButton = document.getElementById("autoButton")

// assign functions to onclick events
connectButton.onclick = connect
RefreshStageButton.onclick = refreshstage
setButton.onclick = set_tender
getParticipantsButton.onclick = get_participants
get_proposalButton.onclick = get_proposal
approveButton.onclick = approve_prop
rejectButton.onclick = reject_prop
ResetButton.onclick = reset_tender
ApproveResetButton.onclick = approve_freset
CancelResetButton.onclick = cancel_freset
ForcedResetButton.onclick = forced_reset
getWinnerButton.onclick = get_winner
autoButton.onclick = autofill

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

  async function set_tender() {
    // get values from html page
    const prop_h_st = document.getElementById("prop_h_st").value
    const prop_h_end = document.getElementById("prop_h_end").value
    const prop_r_st = document.getElementById("prop_r_st").value
    const prop_r_end = document.getElementById("prop_r_end").value
    const price_h_st = document.getElementById("price_h_st").value
    const price_h_end = document.getElementById("price_h_end").value
    const price_r_st = document.getElementById("price_r_st").value
    const price_r_end = document.getElementById("price_r_end").value
    const wit_st = document.getElementById("wit_st").value
    const wit_end = document.getElementById("wit_end").value
    const collat = document.getElementById("collat").value
    const max_price = document.getElementById("max_price").value
    const parsed_col = ethers.utils.parseEther(collat)
    const parsed_maxp = ethers.utils.parseEther(max_price)
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function set_new_tender from contract
        const transactionResponse = await contract.set_new_tender(parsed_col,parsed_maxp,prop_h_st,prop_h_end,prop_r_st,prop_r_end,price_h_st,price_h_end,price_r_st,price_r_end,wit_st,wit_end)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("New tender created!");
        window.alert("The new tender created successfully.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

// auto-fills time serials with proper test values
  async function autofill() {
    const init = 100 + Math.round(Date.now()/1000)
    const dt1 = 1000
    const dt2 = 1000
    document.getElementById("prop_h_st").value = init
    document.getElementById("prop_h_end").value = init + dt1
    document.getElementById("prop_r_st").value = init + dt1 + dt2
    document.getElementById("prop_r_end").value = init + 2*dt1 + dt2
    document.getElementById("price_h_st").value = init + 2*dt1 + 2*dt2
    document.getElementById("price_h_end").value = init + 3*dt1 + 2*dt2
    document.getElementById("price_r_st").value = init + 3*dt1 + 3*dt2
    document.getElementById("price_r_end").value = init + 4*dt1 + 3*dt2
    document.getElementById("wit_st").value = init + 4*dt1 + 4*dt2
    document.getElementById("wit_end").value = init + 5*dt1 + 4*dt2
  }

  // updates the list of participants
  async function get_participants() {
    const ParticipantsList = document.getElementById("ParticipantsList")
    ParticipantsList.value = ""
    let participant
    let i
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function get_number_of_participants from contract
        const number_of_participants = await contract.get_number_of_participants()
        console.log("number_of_participants:"+number_of_participants)
        // call function get_participant from contract in a loop to get wallet's address for each participant
        for (i = 0; i < number_of_participants; i++) {
          participant = await contract.get_participant(i)
          console.log(participant)
          ParticipantsList.value += participant + "\n"    // adds the participant's address to the list
        }
        console.log("List of participants updated.");
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function get_proposal() {
    const ParticipantAddress = document.getElementById("ParticipantAddress").value
    const ProposalContent = document.getElementById("ProposalContent")
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function get_proposal from contract to get requested proposal
        ProposalContent.value = await contract.get_proposal(ParticipantAddress)
        console.log("The proposal content updated.");
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function approve_prop() {
    const ParticipantAddress = document.getElementById("ParticipantAddress").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function approve_proposal from contract
        const transactionResponse = await contract.approve_proposal(ParticipantAddress)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Proposal Approved!");
        window.alert("Proposal Approved!")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function reject_prop() {
    const ParticipantAddress = document.getElementById("ParticipantAddress").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function reject_proposal from contract
        const transactionResponse = await contract.reject_proposal(ParticipantAddress)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Proposal Rejected!");
        window.alert("Proposal Rejected!")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function reset_tender() {
    const ReceiverAddress = document.getElementById("ReceiverAddress").value
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function reset_tender from contract
        const transactionResponse = await contract.reset_tender(ReceiverAddress)
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Reseted!");
        window.alert("The tender successfully reseted.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function approve_freset() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function approve_forced_reset from contract
        const transactionResponse = await contract.approve_forced_reset()
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Forced reset approved");
        window.alert("Forced reset approved.\n\nYou should click on 'Forced Reset' to call its method!")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function cancel_freset() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function cancel_forced_reset from contract
        const transactionResponse = await contract.cancel_forced_reset()
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Forced reset canceled");
        window.alert("Forced reset canceled.")
      } catch (error) {
        console.error('Error:', error);
        window.alert("ERROR!\n\nMessage:\n"+error.data.message)
      }
    } else {
      withdrawButton.innerHTML = "Please install MetaMask"
    }
  }

  async function forced_reset() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        // call function forced_reset_tender from contract
        const transactionResponse = await contract.forced_reset_tender()
        // listen transaction to mine
        await listenForTransactionMine(transactionResponse, provider)
        await transactionResponse.wait(1)
        console.log("Reseted! (forced)");
        window.alert("The tender successfully reseted.")
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
        // call function getWinner from contract
        const winner_address = await contract.getWinner()
        // call function getBestPrice from contract
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

