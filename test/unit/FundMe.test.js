const { deployments, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")

!network.config.chainId == "31337"
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async function () {
              ;[deployer] = await ethers.getSigners()
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.s_priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("receive", function () {
              it("should reflect balance changes when the contract called no data", async function () {
                  await deployer.sendTransaction({
                      to: fundMe.address,
                      data: "0x",
                      value: sendValue,
                  })
                  const fundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  assert.equal(fundBalance.toString(), sendValue.toString())
              })
          })

          describe("fallback", function () {
              it("should reflect balance changes when the contract called with random data", async function () {
                  await deployer.sendTransaction({
                      to: fundMe.address,
                      data: "0x23b872dd",
                      value: sendValue,
                  })
                  const fundBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  assert.equal(fundBalance.toString(), sendValue.toString())
              })
          })

          describe("fund", function () {
              it("Fails if we do not send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "FundMe__NotEnoughFunds()"
                  )
              })

              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer.address
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Fails if the funder was not pushed into the array", async function () {
                  await fundMe.fund({ value: sendValue })
                  funder = await fundMe.s_funders(0)
                  assert.equal(deployer.address, funder.toString())
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("Withdraw ETH from a single funder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer.address)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString()
                  )
              })
          })
      })
