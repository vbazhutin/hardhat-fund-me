const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs")
const { resolve } = require("path")

describe("FundMeFactory", () => {
    let FundMeFactory, Fund, deployer, funder
    const sendValue = ethers.utils.parseEther("1")
    const fundFile = JSON.parse(
        fs.readFileSync("./artifacts/contracts/Fund.sol/Fund.json", "utf-8")
    )
    const fundABI = fundFile.abi

    beforeEach(async () => {
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        funder = accounts[1]
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

        it("should initialize i_minFundETH to the correct value", async () => {
            const i_minFundETH = await FundMeFactory.i_minFundETH()
            const minETH = ethers.utils.parseEther("0.1")
            expect(i_minFundETH.toString()).to.equal(minETH)
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
        const fundName = "Fund 1"
        const fundDuration = 604800
        const targetFunding = ethers.utils.parseEther("10")
        it("should create a new fund contract", async () => {
            const hardhatProvider = ethers.getDefaultProvider(
                "http://localhost:8545"
            )
            const initialFundsLength = (await FundMeFactory.getFunds()).length
            const tx = await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            expect(tx).to.emit("FundCreated")
            const result = await tx.wait()
            const newFund = new ethers.Contract(
                result.events[0].args.fundAddress,
                fundABI,
                hardhatProvider
            )
            const signedNewFund = newFund.connect(deployer)
            const init = await signedNewFund.initialize(
                0,
                fundName,
                deployer.address,
                targetFunding,
                fundDuration,
                FundMeFactory.address
            )
            await init.wait()
            const finalFundsLength = (await FundMeFactory.getFunds()).length
            expect(finalFundsLength).to.equal(initialFundsLength + 1)
            expect(await signedNewFund.fundName()).to.equal(fundName)
        })

        it("should increment the fundsIndexCounter", async () => {
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
            const hardhatProvider = ethers.getDefaultProvider(
                "http://localhost:8545"
            )
            const tx = await FundMeFactory.createFund(
                fundName,
                fundDuration,
                targetFunding
            )
            expect(tx).to.emit("FundCreated")
            const result = await tx.wait()
            const newFund = new ethers.Contract(
                result.events[0].args.fundAddress,
                fundABI,
                hardhatProvider
            )
            const signedNewFund = newFund.connect(deployer)
            const init = await signedNewFund.initialize(
                0,
                fundName,
                deployer.address,
                targetFunding,
                fundDuration,
                FundMeFactory.address
            )
            await init.wait()
            expect(await signedNewFund.fundName()).to.equal(fundName)
            expect(await signedNewFund.fundDuration()).to.equal(fundDuration)
            expect(await signedNewFund.targetFunding()).to.equal(targetFunding)
            expect(await signedNewFund.fundManager()).to.equal(
                FundMeFactory.address
            )
        })

        it("should only be callable with targetFunding greater than or equal to i_minTargetFundingETH", async () => {
            const targetFunding = ethers.utils.parseEther("0.05")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__LowTargetFunding")
        })

        it("should only be callable with valid fundName", async () => {
            const fundName = ""
            const targetFunding = ethers.utils.parseEther("10")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__InvalidFundName")
            const invalidFundName = "123456789012345678901234567890000"
            await expect(
                FundMeFactory.createFund(
                    invalidFundName,
                    fundDuration,
                    targetFunding
                )
            ).to.be.revertedWith("FundMe__InvalidFundName")
        })

        it("should only be callable with valid fundDuration", async () => {
            const fundDuration = 0
            const targetFunding = ethers.utils.parseEther("10")
            await expect(
                FundMeFactory.createFund(fundName, fundDuration, targetFunding)
            ).to.be.revertedWith("FundMe__InvalidFundDuration")
        })
    })

    describe("withdraw()", function () {
        it("should only be callable by the owner", async () => {
            const fundMeFactory = FundMeFactory.connect(funder)
            await expect(fundMeFactory.withdraw()).to.be.revertedWith(
                "FundMe__NotOwner"
            )
        })

        it("should only be callable when the contract's balance is greater than 0", async () => {
            await expect(FundMeFactory.withdraw()).to.be.revertedWith(
                "FundMe__NotEnoughFunds"
            )
        })

        it("should transfer the contract's balance to the owner's address", async () => {
            await deployer.sendTransaction({
                to: FundMeFactory.address,
                value: sendValue,
                data: "0x",
            })
            const initialBalance = await deployer.getBalance()
            expect(
                await ethers.provider.getBalance(FundMeFactory.address)
            ).to.be.equal(sendValue)

            const tx = await FundMeFactory.withdraw()
            const receipt = await tx.wait()
            const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice)
            const finalBalance = await deployer.getBalance()
            expect(
                await ethers.provider.getBalance(FundMeFactory.address)
            ).to.be.equal(0)
            expect(finalBalance.sub(initialBalance).add(gasCost)).to.equal(
                sendValue
            )
        })
    })
})
