const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const fund = await ethers.getContractAt("Fund", deployer)

    const args = [fund.address]
    const fundMeFactory = await deploy("FundMeFactory", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("------------------------------------------------------")
}

module.exports.tags = ["all", "fundMeFactory"]
