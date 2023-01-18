const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMeFactory", () => {
    let FundMeFactory, Fund, deployer
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["all"])
        Fund = await ethers.getContract("Fund", deployer)
        FundMeFactory = await ethers.getContract("FundMeFactory", deployer)
    })

    describe("constructor", () => {
        it("initialized properly", async () => {
            const masterContract = await FundMeFactory.masterContract()
            expect(masterContract).equal(Fund.address)
        })

        it("should initialize fundsIndexCounter to 0", async () => {
            const fundsIndexCounter = await FundMeFactory.fundsIndexCounter()
            expect(fundsIndexCounter.toNumber()).to.equal(0)
        })

        it("should initialize i_minFundUSD to the correct value", async () => {
            const i_minFundUSD = await FundMeFactory.i_minFundUSD()
            expect(i_minFundUSD.toNumber()).to.equal(10)
        })

        it("should initialize i_owner to the msg.sender", async () => {
            const i_owner = await FundMeFactory.i_owner()
            expect(i_owner).to.equal(deployer.address)
        })

        it("should initialize funds array to an empty array", async () => {
            const funds = await FundMeFactory.getFunds()
            expect(funds.length).to.equal(0)
        })
    })

    describe("receive", () => {
        it("should receive ether", async () => {
            const initialBalance = await ethers.provider.getBalance(
                FundMeFactory.address
            )
            const tx = { to: FundMeFactory.address, value: sendValue }
            await deployer.sendTransaction(tx)
            const finalBalance = await ethers.provider.getBalance(
                FundMeFactory.address
            )
            expect(finalBalance.sub(initialBalance)).to.equal(sendValue)
        })
    })

    describe("fallback", () => {
        it("should receive ether via fallback", async () => {
            const initialBalance = await ethers.provider.getBalance(
                FundMeFactory.address
            )
            const tx = {
                to: FundMeFactory.address,
                value: sendValue,
                data: "0x2fac7ab1",
            }
            await deployer.sendTransaction(tx)
            const finalBalance = await ethers.provider.getBalance(
                FundMeFactory.address
            )
            expect(finalBalance.sub(initialBalance)).to.equal(sendValue)
        })
    })

    describe("createFund()", function () {
        it("should create a new fund contract", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            const initialFundsLength = (await FundMeFactory.getFunds()).length
            const fund = await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            const newFund = new ethers.Contract(
                fund,
                Fund.abi,
                FundMeFactory.address
            )
            console.log(newFund)
            const finalFundsLength = (await FundMeFactory.getFunds()).length
            expect(finalFundsLength).to.equal(initialFundsLength + 1)
            expect(await fund.fundName()).to.equal(fundName)
        })

        it("should increment the fundsIndexCounter", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            const initialFundsIndexCounter =
                await FundMeFactory.fundsIndexCounter()
            await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            const finalFundsIndexCounter =
                await FundMeFactory.fundsIndexCounter()
            expect(finalFundsIndexCounter.toNumber()).to.equal(
                initialFundsIndexCounter.toNumber() + 1
            )
        })

        it("should set the correct values in the newly created fund contract", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            const fund = await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            const newFund = await ethers.getContractAt("Fund", fund)
            expect(await newFund.fundName()).to.equal(fundName)
            expect(await newFund.fundDuration()).to.equal(fundDuration)
            expect(await newFund.targetFunding()).to.equal(targetFunding)
            expect(await newFund.factory()).to.equal(FundMeFactory.address)
        })

        it("should only be callable by the owner", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            const nonOwner = await getNamedAccounts().other
            const fundMeFactory = FundMeFactory.connect(nonOwner)
            await expect(
                fundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__NotOwner")
        })

        it("should only be callable with targetFunding greater than or equal to i_minFundUSD", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("5")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__NotEnoughFunds")
        })

        it("should only be callable with valid fundName", async () => {
            const fundName = ""
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__InvalidFundName")
        })

        it("should only be callable with valid fundDuration", async () => {
            const fundName = "Fund 1"
            const fundDuration = 0
            const targetFunding = ethers.utils.parseEther("10")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__InvalidFundDuration")
        })

        it("should only be callable with valid targetFunding", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("0")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__InvalidFundTarget")
        })

        it("should add the new fund contract to the funds array", async () => {
            const fundName = "Fund 1"
            const fundDuration = 100
            const targetFunding = ethers.utils.parseEther("10")
            const initialFunds = await FundMeFactory.funds()
            const fund = await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            const finalFunds = await FundMeFactory.funds()
            expect(finalFunds.length).to.equal(initialFunds.length + 1)
            expect(finalFunds[finalFunds.length - 1]).to.equal(fund)
        })
    })
})
