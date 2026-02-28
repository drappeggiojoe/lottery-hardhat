/**
 * Script di interazione con LotteryWithTickets.
 * Prima fai partire `hardhat node` e poi `deploy:local`,
 * poi copia l'indirizzo del contratto qui sotto.
 *
 * Esegui con: npx hardhat run scripts/interact.js --network localhost
 */

const hre = require("hardhat");
const { parseEther, formatEther } = require("viem");

// ⚠️  Inserisci qui l'indirizzo del contratto dopo il deploy
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

async function main() {
  // Ottieni i wallet client (account di test Hardhat)
  const [manager, player1, player2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("=== 🎰 Lottery Interaction Script ===\n");
  console.log(`Manager  : ${manager.account.address}`);
  console.log(`Player 1 : ${player1.account.address}`);
  console.log(`Player 2 : ${player2.account.address}\n`);

  // Recupera istanza del contratto
  const lottery = await hre.viem.getContractAt("LotteryWithTickets", CONTRACT_ADDRESS);

  // --- 1. Leggi info iniziali ---
  const ticketPrice = await lottery.read.ticketPrice();
  console.log(`🎟️  Prezzo biglietto: ${formatEther(ticketPrice)} ETH`);

  let tickets = await lottery.read.getTickets();
  console.log(`📋 Biglietti iniziali: ${tickets.length}\n`);

  // --- 2. Player1 acquista 2 biglietti ---
  console.log("🛒 Player1 acquista 2 biglietti...");
  const buy1Hash = await lottery.write.buyTickets([], {
    account: player1.account,
    value: parseEther("0.02"), // 2 biglietti * 0.01 ETH
  });
  await publicClient.waitForTransactionReceipt({ hash: buy1Hash });
  console.log(`   Tx: ${buy1Hash}`);

  // --- 3. Player2 acquista 1 biglietto ---
  console.log("🛒 Player2 acquista 1 biglietto...");
  const buy2Hash = await lottery.write.buyTickets([], {
    account: player2.account,
    value: parseEther("0.01"),
  });
  await publicClient.waitForTransactionReceipt({ hash: buy2Hash });
  console.log(`   Tx: ${buy2Hash}`);

  tickets = await lottery.read.getTickets();
  console.log(`\n📋 Biglietti totali: ${tickets.length}`);
  console.log(`   ${tickets.join("\n   ")}`);

  // Saldo contratto
  const balance = await publicClient.getBalance({ address: CONTRACT_ADDRESS });
  console.log(`\n💰 Saldo contratto: ${formatEther(balance)} ETH`);

  // --- 4. Manager sceglie il vincitore ---
  console.log("\n🎉 Il manager estrae il vincitore...");
  const pickHash = await lottery.write.pickWinner([], {
    account: manager.account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: pickHash });

  // Leggi l'evento WinnerSelected dai logs
  const logs = await publicClient.getContractEvents({
    address: CONTRACT_ADDRESS,
    abi: lottery.abi,
    eventName: "WinnerSelected",
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  if (logs.length > 0) {
    const { winner, prize } = logs[0].args;
    console.log(`🏆 Vincitore: ${winner}`);
    console.log(`💎 Premio in pending: ${formatEther(prize)} ETH`);

    // --- 5. Il vincitore ritira i fondi ---
    // Determina quale account è il vincitore
    const winnerClient = [manager, player1, player2].find(
      (w) => w.account.address.toLowerCase() === winner.toLowerCase()
    );

    if (winnerClient) {
      const balanceBefore = await publicClient.getBalance({ address: winner });
      console.log(`\n💸 ${winner} sta ritirando i fondi...`);

      const withdrawHash = await lottery.write.withdraw([], {
        account: winnerClient.account,
      });
      await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

      const balanceAfter = await publicClient.getBalance({ address: winner });
      console.log(`   Balance prima : ${formatEther(balanceBefore)} ETH`);
      console.log(`   Balance dopo  : ${formatEther(balanceAfter)} ETH`);
      console.log(`   ✅ Ritiro completato!`);
    }
  }

  // Verifica reset biglietti
  tickets = await lottery.read.getTickets();
  console.log(`\n📋 Biglietti dopo l'estrazione: ${tickets.length} (reset ✅)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
