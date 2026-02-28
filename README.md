# 🎰 Lottery Hardhat + Viem

Progetto Hardhat per il contratto `LotteryWithTickets.sol`, con script di deploy, interazione e test scritti usando **Viem**.

---

## 📁 Struttura

```
lottery-hardhat/
├── contracts/
│   └── LotteryWithTickets.sol     # Il contratto
├── scripts/
│   ├── deploy.js                  # Script di deploy
│   └── interact.js                # Script di interazione completa
├── test/
│   └── LotteryWithTickets.test.js # Test con Viem + Chai
├── hardhat.config.js
└── package.json
```

---

## ⚙️ Setup

```bash
npm install
```

---

## 🛠️ Comandi

### Compilare il contratto
```bash
npx hardhat compile
```

### Eseguire i test
```bash
npm test
```

### Verificare la coverage
```bash
# Windows CMD
set SOLIDITY_COVERAGE=true && npx hardhat coverage

# Windows PowerShell
$env:SOLIDITY_COVERAGE="true"; npx hardhat coverage

# Mac/Linux
SOLIDITY_COVERAGE=true npx hardhat coverage
```

---

## 🚀 Deploy e interazione in locale

### 1 — Avvia il nodo Hardhat locale (Terminale 1)
```bash
npm run node
```
Lascia questo terminale aperto per tutta la sessione.

### 2 — Deploy del contratto (Terminale 2)
```bash
npm run deploy:local
```
Copia l'indirizzo del contratto stampato in output, ad esempio:
```
✅ LotteryWithTickets deployato all'indirizzo: 0x5fbdb2315678afecb367f032d93f642f64180aa3
```

### 3 — Configura lo script di interazione
Apri `scripts/interact.js` e incolla l'indirizzo nella variabile:
```js
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
```

### 4 — Esegui lo script di interazione (Terminale 2)
```bash
npm run interact
```

Lo script esegue in sequenza:
1. Player1 acquista 2 biglietti (0.02 ETH)
2. Player2 acquista 1 biglietto (0.01 ETH)
3. Il manager estrae il vincitore
4. Il vincitore ritira i fondi via `withdraw()`

> ⚠️ Ogni volta che riavvii `npm run node`, la blockchain riparte da zero e devi ripetere il deploy.

---

## 📦 Dipendenze principali

| Pacchetto | Ruolo |
|-----------|-------|
| `hardhat` | Framework di sviluppo Solidity |
| `@nomicfoundation/hardhat-toolbox-viem` | Plugin Hardhat con integrazione Viem |
| `viem` | Client Ethereum moderno (sostituisce ethers.js) |
| `chai` | Assertion library per i test (inclusa nel toolbox) |