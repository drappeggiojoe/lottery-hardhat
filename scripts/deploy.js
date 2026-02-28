const hre = require("hardhat");
const { formatEther } = require("viem");

async function main() {
  console.log("🚀 Deploying LotteryWithTickets...\n");

  // Con hardhat-toolbox-viem, deployContract usa viem internamente
  const lottery = await hre.viem.deployContract("LotteryWithTickets");

  console.log(`✅ LotteryWithTickets deployato all'indirizzo: ${lottery.address}`);

  // Leggi il manager per confermare il deploy
  const manager = await lottery.read.manager();
  console.log(`👤 Manager: ${manager}`);

  const ticketPrice = await lottery.read.ticketPrice();
  console.log(`🎟️  Prezzo biglietto: ${formatEther(ticketPrice)} ETH`);

  return lottery.address;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });