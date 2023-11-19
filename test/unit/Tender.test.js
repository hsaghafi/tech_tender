// import { time } from "@nomicfoundation/hardhat-network-helpers";

const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const helpers = require("@nomicfoundation/hardhat-network-helpers");
// const { increase, increaseTo, setNextBlockTimestamp, duration } = require("ethers/lib/ethers/helpers/time")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Tender", function () {
          let tender
          let usdt
          let deployer
          let t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10       // timings of tender
          let dt=200        // delta_t to add to a start time of any satge
          // Define sample input data
          // technical proposal 1 address
          const tp1 = "0x9b8075e3114a237714bcee811cbb0337de6d1423cb2947266772aae5963ec8e5"
          // technical proposal 2 address
          const tp2 = "0xad493e3bd34f34f3425a6683dc4ece44dcf258951253112c81f715e56586b30c"
          // technical proposal 3 address
          const tp3 = "0xadb988ebfad21765f509632cc204d7cd28594591bf5c67d6297fd9138c4054a0"
          // hash of technical proposal 1 address (hash of tp1)
          const tp1_hashed = "0xcca85948b39ebfbeeb7daae1a94398608b92d3fac13aa69843bbf05a91918c5d"
          // hash of technical proposal 2 address (hash of tp2)
          const tp2_hashed = "0x0e25c85344cd0ff75a38c526d17671c9c81462411ae51d2e370e9c5111da9129"
          // hash of technical proposal 3 address (hash of tp3)
          const tp3_hashed = "0x69ef911f65576fc905f47b9a93690b9ea2fe2231c65bda5cc304efa893db0d33"
          // sample proposed prices
          const price1 = 5000       // price proposde by acc1
          const price2 = 4500       // price proposde by acc2
          const price3 = 4800       // price proposde by acc3
          const salt1 = "s12gh"     // price1 is hashed in combination with the salt1 to make it impossible to guess
          const salt2 = "qazwsx"    // price2 is hashed in combination with the salt2 to make it impossible to guess
          const salt3 = "iopl_58"   // price3 is hashed in combination with the salt3 to make it impossible to guess
          // results of hashing (price,salt)
          const price_salt1_hashed = "0x993c7bd45f485c75ba8f06c2fc2086db805898ac27c1f9dfcdae80bb1bb19735"
          const price_salt2_hashed = "0x1c5ca8e932c3315ba4b4b9c06160f5e514c3e530d24f04d7fff55fa7850f03e6"
          const price_salt3_hashed = "0x38471d0a59ae661964cc30b5f40613965974ffb8fd8d1f5f4b74a25e47276ec6"
          // sample values for collateral and max_price
          const collateral_value = ethers.utils.parseEther("200")
          const max_price_value = ethers.utils.parseEther("10000")
          beforeEach(async () => {
            // sample timings based on current time (t0) and considering 1000 seconds between different stages
            t0 = await helpers.time.latest()
            t1 = t0 + 1000
            t2 = t0 + 2000
            t3 = t0 + 3000
            t4 = t0 + 4000
            t5 = t0 + 5000
            t6 = t0 + 6000
            t7 = t0 + 7000
            t8 = t0 + 8000
            t9 = t0 + 9000
            t10 = t0 + 10000
              // Deploy the contracts
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              acc1 = accounts[1]
              acc2 = accounts[2]
              acc3 = accounts[3]
              acc4 = accounts[4]
              await deployments.fixture(["all"])
              // get 'USDT' and 'tender' contracts with deployer signer
              usdt = await ethers.getContract("TestUSDT", deployer)
              tender = await ethers.getContract("Tender", deployer)
              // get 'tender' contracts with other accounts as signer
              tender_acc1 = await ethers.getContract("Tender", accounts[1])
              tender_acc2 = await ethers.getContract("Tender", accounts[2])
              tender_acc3 = await ethers.getContract("Tender", accounts[3])
              // get 'USDT' contracts with other accounts as signer
              usdt_acc1 = await ethers.getContract("TestUSDT", accounts[1])
              usdt_acc2 = await ethers.getContract("TestUSDT", accounts[2])
              usdt_acc3 = await ethers.getContract("TestUSDT", accounts[3])
              // Define new tender
              await tender.set_new_tender(collateral_value,max_price_value,
                t1,t2,t3,t4,t5,t6,t7,t8,t9,t10)
                //charge USDT to accounts
                usdt.mint(accounts[1].address,collateral_value)
                usdt.mint(accounts[2].address,collateral_value)
                usdt.mint(accounts[3].address,collateral_value)
          })

          describe("constructor", function () {
              it("sets the USDT contract address correctly", async () => {
                  const response = await tender.get_usdt_contract()
                  assert.equal(response, usdt.address)
              })
          })

          describe("set_new_tender", function () {
            beforeEach(async () => {
                await tender.approve_forced_reset()     //approve reset the initial defined tender
                await tender.forced_reset_tender()      //reset the initial defined tender
            })
            it("Fails if not Owner", async () => {
                await expect(tender_acc1.set_new_tender(collateral_value,max_price_value,
                    t1,t2,t4,t3,t5,t6,t7,t8,t9,t10)).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Fails if sequence of timing is not correct", async () => {
                await expect(tender.set_new_tender(collateral_value,max_price_value,
                    t1,t2,t4,t3,t5,t6,t7,t8,t9,t10)).to.be.revertedWith(
                    "The sequence of timing is not correct!")
            })
            it("Should correctly set value of variables", async () => {
                await expect(tender.set_new_tender(collateral_value,max_price_value,
                    t1,t2,t3,t4,t5,t6,t7,t8,t9,t10)).to.emit(tender,"newTender").withArgs(
                    t1,t2,t3,t4,t5,t6,t7,t8,t9,t10)
                // check correct setting of variables
                expect(await tender.getCollateral()).to.equal(collateral_value)
                expect(await tender.getMaxPrice()).to.equal(max_price_value)
                expect(await tender.getSettingState()).to.equal(false)
            })
            it("Fails if called before current tender finished", async () => {
                // set new tender
                tender.set_new_tender(collateral_value,max_price_value,t1,t2,t3,t4,t5,t6,t7,t8,t9,t10)
                // set new tender again before the previous one is finished
                await expect(tender.set_new_tender(collateral_value,max_price_value,
                    t1,t2,t3,t4,t5,t6,t7,t8,t9,t10)).to.be.revertedWith("Not in setting state!")
            })
        })

        describe("reset_tender", function () {
            it("Fails if not Owner", async () => {
                await helpers.time.increaseTo(t10+dt);            //setting the timestamp to end of tender
                await expect(tender_acc1.reset_tender(deployer.address)).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Fails if tender not finished", async () => {
                await expect(tender.reset_tender(deployer.address)).to.be.revertedWith(
                    "Wait until the end of the current tender!")
            })
            it("Should successfully transfer the balance of contract", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await helpers.time.increaseTo(t10+dt);            //setting the timestamp to end of tender
                // reset the current tender
                await expect(tender.reset_tender(deployer.address)).to.emit(tender,"TenderReset")
                // check the balances of contract, deployer, acc1(participant)
                const number_of_participants= await tender.get_number_of_participants()
                const final_balance_deployer = await usdt_acc1.balanceOf(deployer.address)
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                const final_balance_contract = await usdt_acc1.balanceOf(tender_acc1.address)
                assert.equal(number_of_participants.toString(),"0")
                assert.equal(final_balance_acc1.toString(),"0")
                assert.equal(final_balance_contract.toString(),"0")
                assert.equal(final_balance_deployer.toString(),collateral_value.toString())
            })
        })

        describe("approve_forced_reset", function () {
            it("Fails if not Owner", async () => {
                // call using acc1 as signer
                await expect(tender_acc1.approve_forced_reset()).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Should successfully approve the forced reset", async () => {
                // approve the forced reset of the current tender
                await expect(tender.approve_forced_reset()).to.emit(tender,"TenderForcedResetApproved")
            })
        })

        describe("cancel_forced_reset", function () {
            it("Fails if not Owner", async () => {
                // call using acc1 as signer
                await expect(tender_acc1.cancel_forced_reset()).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Should successfully cancel the forced reset", async () => {
                // cancel the forced reset of the current tender
                await expect(tender.cancel_forced_reset()).to.emit(tender,"TenderForcedResetCanceled")
            })
        })

        describe("tender_forced_reset", function () {
            it("Fails if not Owner", async () => {
                // approve the forced reset of the current tender
                await tender.approve_forced_reset()
                // call forced reset using acc1 as signer
                await expect(tender_acc1.forced_reset_tender()).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Fails if forced reset not approved before", async () => {
                // approve the forced reset of the current tender
                await expect(tender.forced_reset_tender()).to.be.revertedWith(
                    "You need to run approve_forced_reset() at first!\nWARNING: By running this method all operations in the current tender will be canceled and collaterals refunded.")
            })
            it("Should successfully forced reset the tender", async () => {
                // at first approve the forced reset of the current tender
                await expect(tender.approve_forced_reset()).to.emit(tender,"TenderForcedResetApproved")
                await expect(tender.forced_reset_tender()).to.emit(tender,"TenderForcedReset")
            })
            it("Should successfully refund the collateral to participants during the forced reset", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participants' wallet
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the rehashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // at first approve the forced reset of the current tender
                await tender.approve_forced_reset()
                // apply the forced reset of the current tender
                await tender.forced_reset_tender()
                // check the number of articipants and the balances of contract and participants' wallet
                const number_of_participants= await tender.get_number_of_participants()
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                const final_balance_acc2 = await usdt_acc2.balanceOf(acc2.address)
                const final_balance_acc3 = await usdt_acc3.balanceOf(acc3.address)
                const final_balance_contract = await usdt_acc1.balanceOf(tender_acc1.address)
                assert.equal(number_of_participants.toString(),"0")
                assert.equal(final_balance_acc1.toString(),collateral_value.toString())
                assert.equal(final_balance_acc2.toString(),collateral_value.toString())
                assert.equal(final_balance_acc3.toString(),collateral_value.toString())
                assert.equal(final_balance_contract.toString(),"0")
            })
        })

        describe("send_proposal_hash", function () {
            it("Fails if not in the 'sending rehashed proposal' stage", async () => {
                // shift the time to a moment after stage of sending rehashed proposal
                await helpers.time.increaseTo(t2+dt)
                await expect(tender_acc1.send_proposal_hash(tp1_hashed)).to.be.revertedWith(
                    "Tender is not in the stage which can accept this request!")
            })
            it("Should successfully register sent hashed proposal", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the rehashed proposal from acc1
                await expect(tender_acc1.send_proposal_hash(tp1_hashed)).to.emit(
                    tender,"HashedPropsalRegistered").withArgs(acc1.address)
            })
            it("Should successfully transfer collateral from participant's wallet to the contract", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the rehashed proposal from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // check the balances of contract and participants' wallet
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                const final_balance_contract = await usdt_acc1.balanceOf(tender_acc1.address)
                assert.equal(final_balance_acc1.toString(),"0")
                assert.equal(final_balance_contract.toString(),collateral_value.toString())
            })
            it("Should prevent duplicating participant", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the hashed proposal tp1 from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // mint USDT again and approve
                usdt.mint(acc1.address,collateral_value)
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // resend the hashed proposal tp2 from acc1
                await tender_acc1.send_proposal_hash(tp2_hashed)
                // check number of participant and balance of contract and acc1 not changed
                const number_of_participants= await tender_acc1.get_number_of_participants()
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                const final_balance_contract = await usdt_acc1.balanceOf(tender_acc1.address)
                assert.equal(number_of_participants.toString(),"1")
                assert.equal(final_balance_acc1.toString(),collateral_value.toString())
                assert.equal(final_balance_contract.toString(),collateral_value.toString())
                // check the new proposal is registered for acc1
                await helpers.time.increaseTo(t3+dt)    // shift the time to the stage of sending revealed proposal
                await expect(tender_acc1.send_proposal_reveal(tp2)).to.emit(
                    tender,"RevealedPropsalRegistered").withArgs(acc1.address)
                const proposal1 = await tender.get_proposal(acc1.address)
                assert.equal(proposal1,tp2)
            })
        })

        describe("send_proposal_reveal", function () {
            it("Fails if not in the 'sending revealed proposal' stage", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the hashed proposal tp1 from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to a moment after stage of sending revealed proposal
                await helpers.time.increaseTo(t5+dt)
                // send the revealed proposal tp1 from acc1
                await expect(tender_acc1.send_proposal_reveal(tp1)).to.be.revertedWith(
                    "Tender is not in the stage which can accept this request!")
            })
            it("Fails if sent revealed proposal not matches with previously sent hash value", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the hashed proposal tp1 from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposal tp2(<>tp1) from acc1
                await expect(tender_acc1.send_proposal_reveal(tp2)).to.be.revertedWith(
                    "The hash of the sent value should be equal to the previous stage submission")
            })
            it("Fails if sent revealed proposal registered before", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the hashed proposal tp1 from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposal tp1 from acc1
                await tender_acc1.send_proposal_reveal(tp1)
                // send the revealed proposal tp1 from acc1
                await expect(tender_acc1.send_proposal_reveal(tp1)).to.be.revertedWith(
                    "Your revealed proposal hash been already registered!")
            })
            it("Should successfully register sent revealed proposal", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant's wallet
                await usdt_acc1.approve(tender_acc1.address,collateral_value)
                // send the hashed proposal tp1 from acc1
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposal tp1 from acc1
                await expect(tender_acc1.send_proposal_reveal(tp1)).to.emit(
                    tender,"RevealedPropsalRegistered").withArgs(acc1.address)
            })
        })

        describe("approve_proposal", function () {
            beforeEach(async () => {    //sending 3 proposals from 3 different wallets
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
            })
            it("Fails if not owner", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await expect(tender_acc1.approve_proposal(acc1.address)).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Fails if address didn't send the proposal", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await expect(tender.approve_proposal(acc4.address)).to.be.revertedWith(
                    "This address didn't send the proposal")
            })
            it("Should successfully approve a participant", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await expect(tender.approve_proposal(acc1.address)).to.emit(
                    tender,"PropsalApproved").withArgs(acc1.address)
            })
            it("Fails if an address approved twice", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)
                await expect(tender.approve_proposal(acc1.address)).to.be.revertedWith(
                    "This participant hash been already approved!")
            })
        })

        describe("reject_proposal", function () {
            beforeEach(async () => {    // sending 3 proposals from 3 different wallets
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
            })
            it("Fails if not owner", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await expect(tender_acc1.reject_proposal(acc1.address)).to.be.revertedWith(
                    "Only owner can call this method!")
            })
            it("Fails if address didn't send the proposal", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await expect(tender.reject_proposal(acc4.address)).to.be.revertedWith(
                    "This address didn't send the proposal")
            })
            it("Should successfully reject a previously approved participant", async () => {
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)
                await expect(tender.reject_proposal(acc1.address)).to.emit(
                    tender,"PropsalRejected").withArgs(acc1.address)
            })
        })

        describe("send_price_hash", function () {
            beforeEach(async () => {    // sending 3 proposals from 3 different wallets and approving two of them
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)     // approve acc1
                await tender.approve_proposal(acc2.address)     // approve acc2
                // acc3 remained unapproved
            })
            it("Fails if not in the 'sending hashed price' stage", async () => {
                // shift the time to a moment before stage of sending hashed price
                await helpers.time.increaseTo(t5-dt)
                await expect(tender_acc1.send_price_hash(price_salt1_hashed)).to.be.revertedWith(
                    "Tender is not in the stage which can accept this request!")
            })
            it("Fails if address was not approved", async () => {
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                await expect(tender_acc3.send_price_hash(price_salt3_hashed)).to.be.revertedWith(
                    "Unfortunately your proposal was not approved!")
            })
            it("Should successfully register hash of proposed price (hashed with a secret salt)", async () => {
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                await expect(tender_acc1.send_price_hash(price_salt1_hashed)).to.emit(
                    tender,"HashedPriceRegistered").withArgs(acc1.address)
            })
        })

        describe("send_price_reveal", function () {
            beforeEach(async () => {    // sending 3 proposals from 3 different wallets and approving two of them
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)     // approve acc1
                await tender.approve_proposal(acc2.address)     // approve acc2
                // acc3 remained unapproved
            })
            it("Fails if not in the 'sending revealed price' stage", async () => {
                // shift the time to a moment before stage of sending revealed price
                await helpers.time.increaseTo(t7-dt)
                await expect(tender_acc1.send_price_reveal(price1,salt1)).to.be.revertedWith(
                    "Tender is not in the stage which can accept this request!")
            })
            it("Fails if address was not approved", async () => {
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                await expect(tender_acc3.send_price_reveal(price3,salt3)).to.be.revertedWith(
                    "Unfortunately your proposal was not approved!")
            })
            it("Fails if hash of sent (price+salt) not matches with previously sent hash value", async () => {
                // send hashed price from acc1
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                await tender_acc1.send_price_hash(price_salt1_hashed)
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                await expect(tender_acc1.send_price_reveal(price2,salt1)).to.be.revertedWith(
                    "The hash of the sent (price,salt) should be equal to the previous stage submission")
            })
            it("Should successfully register proposed price", async () => {
                // send hashed price from acc1
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                await tender_acc1.send_price_hash(price_salt1_hashed)
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                await expect(tender_acc1.send_price_reveal(price1,salt1)).to.emit(
                    tender,"RevealedPriceRegistered").withArgs(acc1.address)
            })
        })
        
        describe("withdraw", function () {
            it("Fails if withdraw() function called by a wallet didn't participate in the tender ", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallet
                await usdt_acc1.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                await expect(tender_acc2.withdraw()).to.be.revertedWith(
                    "You didn't participate in the current tender yet!")
            })
            it("Should successfully withdraw the collateral and remove the participant at early stages", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallet
                await usdt_acc1.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                await expect(tender_acc1.withdraw()).to.emit(
                    tender,"Withdraw").withArgs(acc1.address,collateral_value)
                // check the number of articipants and the balances of contract and participants' wallet
                const number_of_participants = await tender.get_number_of_participants()
                assert.equal(number_of_participants.toString(),"0")
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                const final_balance_contract = await usdt_acc1.balanceOf(tender_acc1.address)
                assert.equal(final_balance_acc1.toString(),collateral_value.toString())
                assert.equal(final_balance_contract.toString(),"0")
            })
        })

        describe("withdraw", function () {
            beforeEach(async () => {    // sending 3 proposals and prices from 3 different wallets and approving them
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)     // approve acc1
                await tender.approve_proposal(acc2.address)     // approve acc2
                await tender.approve_proposal(acc3.address)     // approve acc2
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                // send the hashed proposed prices from participants
                await tender_acc1.send_price_hash(price_salt1_hashed)
                await tender_acc2.send_price_hash(price_salt2_hashed)
                await tender_acc3.send_price_hash(price_salt3_hashed)
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                // send the revealed proposed prices from participants
                await tender_acc1.send_price_reveal(price1,salt1)
                await tender_acc2.send_price_reveal(price2,salt2)
                await tender_acc3.send_price_reveal(price3,salt3)
            })
            it("Fails if the winner of the tender wants to withdraw", async () => {
                // shift the time to the stage of withdrawal
                await helpers.time.increaseTo(t9+dt)
                await expect(tender_acc2.withdraw()).to.be.revertedWith(
                    "The winner of tender can not call the withdraw() method!")
                // check the number of participants and the balances of contract and participants' wallet
                const number_of_participants = await tender.get_number_of_participants()
                assert.equal(number_of_participants.toString(),"3")
                const final_balance_acc2 = await usdt_acc1.balanceOf(acc2.address)
                assert.equal(final_balance_acc2.toString(),"0")
            })
            it("Should successfully withdraw the collateral and remove the participant at withdrawal stage", async () => {
                // shift the time to the stage of withdrawal
                await helpers.time.increaseTo(t9+dt)
                await expect(tender_acc1.withdraw()).to.emit(
                    tender,"Withdraw").withArgs(acc1.address,collateral_value)
                // check the number of participants and the balances of contract and participants' wallet
                const number_of_participants = await tender.get_number_of_participants()
                assert.equal(number_of_participants.toString(),"2")
                const final_balance_acc1 = await usdt_acc1.balanceOf(acc1.address)
                assert.equal(final_balance_acc1.toString(),collateral_value.toString())
            })
        })

        describe("get_participant", function () {
            it("Should successfully return the wallet address of desired participant", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // get the participants' addresses from contract
                const participant1_address = await tender.get_participant(0)
                const participant2_address = await tender.get_participant(1)
                const participant3_address = await tender.get_participant(2)
                // check the participants' addresses
                assert.equal(participant1_address,acc1.address)
                assert.equal(participant2_address,acc2.address)
                assert.equal(participant3_address,acc3.address)
            })
        })

        describe("get_proposal", function () {
            it("Should successfully return the wallet address of desired participant", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // get the participants' saved proposals from contract
                const participant1_proposal = await tender.get_proposal(acc1.address)
                const participant2_proposal = await tender.get_proposal(acc2.address)
                const participant3_proposal = await tender.get_proposal(acc3.address)
                // check the participants' proposals
                assert.equal(participant1_proposal,tp1)
                assert.equal(participant2_proposal,tp2)
                assert.equal(participant3_proposal,tp3)
            })
        })

        describe("is_approved", function () {
            it("Should successfully return the state of approve for different participants", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)     // approve acc1
                await tender.approve_proposal(acc2.address)     // approve acc2
                // acc3 remained unapproved

                // get approve states from contract
                const participant1_approve_state = await tender.is_approved(acc1.address)
                const participant2_approve_state = await tender.is_approved(acc2.address)
                const participant3_approve_state = await tender.is_approved(acc3.address)
                // check approve states
                assert.equal(participant1_approve_state,true)
                assert.equal(participant2_approve_state,true)
                assert.equal(participant3_approve_state,false)
            })
        })

        describe("getWinner & getBestPrice", function () {
            it("Should successfully return the winner of tender and the lowest proposed price", async () => {
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                // approve spending USDT by the tender contract from participant wallets
                await usdt_acc1.approve(tender.address,collateral_value)
                await usdt_acc2.approve(tender.address,collateral_value)
                await usdt_acc3.approve(tender.address,collateral_value)
                // send the hashed proposals from participants
                await tender_acc1.send_proposal_hash(tp1_hashed)
                await tender_acc2.send_proposal_hash(tp2_hashed)
                await tender_acc3.send_proposal_hash(tp3_hashed)
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                // send the revealed proposals from participants
                await tender_acc1.send_proposal_reveal(tp1)
                await tender_acc2.send_proposal_reveal(tp2)
                await tender_acc3.send_proposal_reveal(tp3)
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                await tender.approve_proposal(acc1.address)     // approve acc1
                await tender.approve_proposal(acc2.address)     // approve acc2
                await tender.approve_proposal(acc3.address)     // approve acc2
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                // send the hashed prices from participants
                await tender_acc1.send_price_hash(price_salt1_hashed)
                await tender_acc2.send_price_hash(price_salt2_hashed)
                await tender_acc3.send_price_hash(price_salt3_hashed)
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                // send the revealed prices from participants
                await tender_acc1.send_price_reveal(price1,salt1)
                await tender_acc2.send_price_reveal(price2,salt2)
                await tender_acc3.send_price_reveal(price3,salt3)

                const tender_winner = await tender.getWinner()
                const tender_best_price = await tender.getBestPrice()
                assert.equal(tender_winner,acc2.address)
                assert.equal(tender_best_price,price2)
            })
        })

        describe("getStage", function () {
            it("Should correctly detects the stage of tender in the different priods of time", async () => {
                // shift the time to a moment before start of the tender
                await helpers.time.increaseTo(t1-dt)
                let stage = await tender.getStage()
                assert.equal(stage.toString(),"1")
                // shift the time to the stage of sending rehashed proposal
                await helpers.time.increaseTo(t1+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"2")
                // shift the time to a moment after the stage of sending rehashed proposal
                await helpers.time.increaseTo(t2+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"0")
                // shift the time to the stage of sending revealed proposal
                await helpers.time.increaseTo(t3+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"3")
                // shift the time to the stage of proposal review
                await helpers.time.increaseTo(t4+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"4")
                // shift the time to the stage of sending hashed price
                await helpers.time.increaseTo(t5+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"5")
                // shift the time to a moment after the stage of sending hashed price
                await helpers.time.increaseTo(t6+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"0")
                // shift the time to the stage of sending revealed price
                await helpers.time.increaseTo(t7+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"6")
                // shift the time to a moment after the stage of sending revealed price
                await helpers.time.increaseTo(t8+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"0")
                // shift the time to the stage of withdraw
                await helpers.time.increaseTo(t9+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"7")
                // shift the time to a moment after the stage of withdraw
                await helpers.time.increaseTo(t10+dt)
                stage = await tender.getStage()
                assert.equal(stage.toString(),"8")
            })
        })

    })
    
