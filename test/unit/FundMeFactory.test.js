const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMeFactory", function () {
    let fundMeFactory
    let fund
    let deployer
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fund = await ethers.getContractAt("Fund", deployer)
        fundMeFactory = await ethers.getContractAt("FundMeFactory", deployer)
        console.log(fund.address)
        console.log(fundMeFactory.address)
    })

    describe("constructor", function () {
        it("initialized properly", async () => {
            console.log("works")
            // const masterContract = await fundMeFactory.masterContract()
            // expect(masterContract).equal(fundAddress)
        })
    })

    // describe("fund", function () {
    //     // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
    //     // could also do assert.fail
    //     it("Fails if you don't send enough ETH", async () => {
    //         await expect(fundMe.fund()).to.be.revertedWith(
    //             "You need to spend more ETH!"
    //         )
    //     })
    //     // we could be even more precise here by making sure exactly $50 works
    //     // but this is good enough for now
    //     it("Updates the amount funded data structure", async () => {
    //         await fundMe.fund({ value: sendValue })
    //         const response = await fundMe.getAddressToAmountFunded(deployer)
    //         assert.equal(response.toString(), sendValue.toString())
    //     })
    //     it("Adds funder to array of funders", async () => {
    //         await fundMe.fund({ value: sendValue })
    //         const response = await fundMe.getFunder(0)
    //         assert.equal(response, deployer)
    //     })
    // })
})
