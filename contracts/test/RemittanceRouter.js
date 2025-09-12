const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RemittanceRouter", function () {
  async function deployFixture() {
    const [deployer, alice, bob, feeCollector, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestToken");
    const initialSupply = ethers.parseUnits("1000000", 18);
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();

    const Router = await ethers.getContractFactory("RemittanceRouter");
    const router = await Router.deploy(feeCollector.address, 100); // 1%
    await router.waitForDeployment();

    await router.setAllowedToken(await token.getAddress(), true);

    // fund alice
    await token.transfer(alice.address, ethers.parseUnits("1000", 18));

    return { deployer, alice, bob, feeCollector, other, token, router };
  }

  it("owner can set token and fees within limit", async function () {
    const { router, token } = await deployFixture();
    expect(await router.isTokenAllowed(await token.getAddress())).to.equal(true);
    await expect(router.setFeeBps(200)).to.not.be.reverted; // max 2%
    await expect(router.setFeeBps(201)).to.be.revertedWith("fee too high");
  });

  it("non-owner cannot set config", async function () {
    const { router, token, other } = await deployFixture();
    await expect(router.connect(other).setAllowedToken(await token.getAddress(), true)).to.be.revertedWith("Not owner");
    await expect(router.connect(other).setFeeCollector(other.address)).to.be.revertedWith("Not owner");
    await expect(router.connect(other).setFeeBps(100)).to.be.revertedWith("Not owner");
  });

  it("remit charges fee and sends net to recipient", async function () {
    const { alice, bob, feeCollector, token, router } = await deployFixture();

    const amount = ethers.parseUnits("100", 18);
    await token.connect(alice).approve(await router.getAddress(), amount);

    const feeBps = await router.feeBps();
    const expectedFee = amount * feeBps / 10000n;
    const expectedNet = amount - expectedFee;

    await expect(router.connect(alice).remit(await token.getAddress(), bob.address, amount, "hello"))
      .to.emit(router, "Remitted")
      .withArgs(await token.getAddress(), alice.address, bob.address, amount, expectedFee, "hello");

    expect(await token.balanceOf(bob.address)).to.equal(expectedNet);
    expect(await token.balanceOf(feeCollector.address)).to.equal(expectedFee);
  });

  it("rejects unallowed token and zero values", async function () {
    const { alice, bob, token, router } = await deployFixture();
    // disallow token
    await router.setAllowedToken(await token.getAddress(), false);
    await token.connect(alice).approve(await router.getAddress(), 1);
    await expect(router.connect(alice).remit(await token.getAddress(), bob.address, 1, "x")).to.be.revertedWith("token not allowed");
    await router.setAllowedToken(await token.getAddress(), true);
    await expect(router.connect(alice).remit(await token.getAddress(), ethers.ZeroAddress, 1, "x")).to.be.revertedWith("to zero");
    await expect(router.connect(alice).remit(await token.getAddress(), bob.address, 0, "x")).to.be.revertedWith("amount zero");
  });
});


