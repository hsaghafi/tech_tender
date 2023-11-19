Technical Tender

Admin of the smart contract can define a new tender by defining time of start and end of different stages:
1. Hashed proposal send: In this stage, each participant should upload his/her proposal on IPFS and send the hashed address of it plus a pre-determined collateral to the contract.
2. Reveal proposal send: In this stage, each participant should send the real address of proposal
3. ‫‪‬‬‫‪Review‬‬‫‪ and‬‬ ‫‪Approve/Reject‬‬  the proposals: This stage is done by admin and acceptable proposals are approved.
4. Hashed price send: in this stage, only approved participants allowed to send proposed price. The priced was hashed by a salt to prevent data leaking.
4. Revealed price send: The real proposed price value+salt should be sent in this stage.
5. Withdraw: In this stage, the winner of tender is determined by the contract and other participants (except winner) can withdraw their collateral.
