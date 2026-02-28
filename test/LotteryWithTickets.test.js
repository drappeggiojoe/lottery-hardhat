const { expect } = require("chai");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox-viem/network-helpers");
const { parseEther } = require("viem");

// ─────────────────────────────────────────────────────────────
// FIXTURES
// Ogni fixture fa uno snapshot della blockchain e lo ripristina
// prima di ogni test che la usa → più veloce del deploy ripetuto
// ─────────────────────────────────────────────────────────────

/** Fixture base: solo deploy */
async function deployLotteryFixture() {
  const [manager, player1, player2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const lottery = await hre.viem.deployContract("LotteryWithTickets");
  return { lottery, manager, player1, player2, publicClient };
}

/** Fixture con biglietti già acquistati (player1: 2, player2: 1) */
async function lotteryWithTicketsFixture() {
  const base = await deployLotteryFixture();
  const { lottery, player1, player2 } = base;

  await lottery.write.buyTickets([], {
    account: player1.account,
    value: parseEther("0.02"),
  });
  await lottery.write.buyTickets([], {
    account: player2.account,
    value: parseEther("0.01"),
  });
  return base;
}

/** Fixture con vincitore già estratto (player1 è l'unico → vincitore certo) */
async function lotteryAfterPickFixture() {
  const base = await deployLotteryFixture();
  const { lottery, manager, player1 } = base;

  await lottery.write.buyTickets([], {
    account: player1.account,
    value: parseEther("0.01"),
  });
  await lottery.write.pickWinner([], { account: manager.account });
  return base;
}

// ─────────────────────────────────────────────────────────────
// TEST
// ─────────────────────────────────────────────────────────────

describe("LotteryWithTickets", function () {

  // ── Deploy ───────────────────────────────────────────────
  describe("Deploy", function () {
    it("Imposta il manager correttamente", async function () {
      const { lottery, manager } = await loadFixture(deployLotteryFixture);

      const contractManager = await lottery.read.manager();
      expect(contractManager.toLowerCase()).to.equal(
        manager.account.address.toLowerCase()
      );
    });

    it("Il prezzo del biglietto è 0.01 ETH", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      const price = await lottery.read.ticketPrice();
      expect(price).to.equal(parseEther("0.01"));
    });

    it("L'array biglietti è vuoto inizialmente", async function () {
      const { lottery } = await loadFixture(deployLotteryFixture);

      const tickets = await lottery.read.getTickets();
      expect(tickets.length).to.equal(0);
    });
  });

  // ── buyTickets ───────────────────────────────────────────
  describe("buyTickets", function () {
    it("Permette di acquistare 1 biglietto", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await lottery.write.buyTickets([], {
        account: player1.account,
        value: parseEther("0.01"),
      });

      const tickets = await lottery.read.getTickets();
      expect(tickets.length).to.equal(1);
      expect(tickets[0].toLowerCase()).to.equal(
        player1.account.address.toLowerCase()
      );
    });

    it("Permette di acquistare più biglietti insieme", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await lottery.write.buyTickets([], {
        account: player1.account,
        value: parseEther("0.03"),
      });

      const tickets = await lottery.read.getTickets();
      expect(tickets.length).to.equal(3);
    });

    it("Registra correttamente l'indirizzo per ogni biglietto", async function () {
      const { lottery, player1, player2 } = await loadFixture(deployLotteryFixture);

      await lottery.write.buyTickets([], {
        account: player1.account,
        value: parseEther("0.02"),
      });
      await lottery.write.buyTickets([], {
        account: player2.account,
        value: parseEther("0.01"),
      });

      const tickets = await lottery.read.getTickets();
      expect(tickets.length).to.equal(3);
      expect(tickets[0].toLowerCase()).to.equal(
        player1.account.address.toLowerCase()
      );
      expect(tickets[2].toLowerCase()).to.equal(
        player2.account.address.toLowerCase()
      );
    });

    it("Revert se si invia meno del prezzo minimo", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await expect(
        lottery.write.buyTickets([], {
          account: player1.account,
          value: parseEther("0.005"),
        })
      ).to.be.rejectedWith("Devi inviare almeno il prezzo di un biglietto");
    });

    it("Revert se l'importo non è multiplo del prezzo", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await expect(
        lottery.write.buyTickets([], {
          account: player1.account,
          value: parseEther("0.015"),
        })
      ).to.be.rejectedWith(
        "L'importo inviato deve essere un multiplo del prezzo del biglietto"
      );
    });

    it("Revert se si usa receive() direttamente", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await expect(
        player1.sendTransaction({
          to: lottery.address,
          value: parseEther("0.01"),
        })
      ).to.be.rejectedWith("Usa buyTickets per mandare ETH");
    });
  });

  // ── pickWinner ───────────────────────────────────────────
  describe("pickWinner", function () {
    it("Solo il manager può estrarre il vincitore", async function () {
      const { lottery, player1 } = await loadFixture(lotteryWithTicketsFixture);

      await expect(
        lottery.write.pickWinner([], { account: player1.account })
      ).to.be.rejectedWith("Solo il manager puo' chiamare questa funzione");
    });

    it("Revert se non ci sono biglietti", async function () {
      const { lottery, manager } = await loadFixture(deployLotteryFixture);

      await expect(
        lottery.write.pickWinner([], { account: manager.account })
      ).to.be.rejectedWith("Non ci sono biglietti acquistati");
    });

    it("Resetta l'array biglietti dopo l'estrazione", async function () {
      const { lottery, manager } = await loadFixture(lotteryWithTicketsFixture);

      await lottery.write.pickWinner([], { account: manager.account });

      const tickets = await lottery.read.getTickets();
      expect(tickets.length).to.equal(0);
    });

    it("Assegna il saldo al vincitore in pendingWithdrawals", async function () {
      const { lottery, manager, publicClient } = await loadFixture(lotteryWithTicketsFixture);

      const contractBalance = await publicClient.getBalance({
        address: lottery.address,
      });

      const hash = await lottery.write.pickWinner([], {
        account: manager.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getContractEvents({
        address: lottery.address,
        abi: lottery.abi,
        eventName: "WinnerSelected",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.equal(1);
      const { winner, prize } = logs[0].args;
      expect(prize).to.equal(contractBalance);

      const pending = await lottery.read.pendingWithdrawals([winner]);
      expect(pending).to.equal(contractBalance);
    });

    it("Emette l'evento WinnerSelected", async function () {
      const { lottery, manager, publicClient } = await loadFixture(lotteryWithTicketsFixture);

      const hash = await lottery.write.pickWinner([], {
        account: manager.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getContractEvents({
        address: lottery.address,
        abi: lottery.abi,
        eventName: "WinnerSelected",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
    });
  });

  // ── withdraw ─────────────────────────────────────────────
  describe("withdraw", function () {
    it("Il vincitore può ritirare i fondi", async function () {
      const { lottery, player1, publicClient } = await loadFixture(lotteryAfterPickFixture);

      const balBefore = await publicClient.getBalance({
        address: player1.account.address,
      });

      await lottery.write.withdraw([], { account: player1.account });

      const balAfter = await publicClient.getBalance({
        address: player1.account.address,
      });

      // BigInt non supportato da Chai greaterThan → operatore nativo
      expect(balAfter > balBefore).to.be.true;

      const pending = await lottery.read.pendingWithdrawals([
        player1.account.address,
      ]);
      expect(pending).to.equal(0n);
    });

    it("Revert se non ci sono fondi da ritirare", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      await expect(
        lottery.write.withdraw([], { account: player1.account })
      ).to.be.rejectedWith("Nessun fondo da prelevare");
    });

    it("Emette l'evento Withdrawal", async function () {
      const { lottery, player1, publicClient } = await loadFixture(lotteryAfterPickFixture);

      const hash = await lottery.write.withdraw([], { account: player1.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getContractEvents({
        address: lottery.address,
        abi: lottery.abi,
        eventName: "Withdrawal",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
    });

    it("Non permette di ritirare due volte", async function () {
      const { lottery, player1 } = await loadFixture(lotteryAfterPickFixture);

      await lottery.write.withdraw([], { account: player1.account });

      await expect(
        lottery.write.withdraw([], { account: player1.account })
      ).to.be.rejectedWith("Nessun fondo da prelevare");
    });
  });

  // ── fallback ─────────────────────────────────────────────
  describe("fallback", function () {
    it("Revert se si chiama una funzione inesistente (fallback)", async function () {
      const { lottery, player1 } = await loadFixture(deployLotteryFixture);

      // Invia una transazione con calldata sconosciuta per triggerare la fallback()
      await expect(
        player1.sendTransaction({
          to: lottery.address,
          data: "0xdeadbeef",
          value: 0n,
        })
      ).to.be.rejected;
    });
  });
});