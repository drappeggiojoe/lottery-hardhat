# 🎰 Lottery Hardhat + Viem

Progetto Hardhat per il contratto `LotteryWithTickets.sol`, con script di deploy, interazione, test e automazione scritti usando **Viem**.

---

## 📁 Struttura

```
lottery-hardhat/
├── contracts/
│   └── LotteryWithTickets.sol      # Il contratto
├── scripts/
│   ├── deploy.js                   # Script di deploy
│   └── interact.js                 # Script di interazione completa
├── test/
│   └── LotteryWithTickets.test.js  # 19 test con Viem + Chai
├── hardhat.config.js
├── package.json
└── run.bat                         # Automazione completa con un click (Windows)
```

---

## ⚙️ Setup

```bash
npm install
```

---

## 🚀 Avvio rapido (Windows)

Il modo più semplice per eseguire tutto è fare **doppio click** su `run.bat`.

Lo script esegue automaticamente in sequenza:

1. `npm install` — installa le dipendenze
2. `npx hardhat compile` — compila il contratto
3. `npx hardhat test` — esegue tutti i test
4. Avvia il nodo Hardhat locale in una finestra separata
5. Deploy del contratto e salvataggio automatico dell'indirizzo
6. Esegue lo script di interazione completa

> ⚠️ Su Windows è normale vedere `Assertion failed: UV_HANDLE_CLOSING` — è un bug noto di Node.js/Windows che non influenza i risultati.

---

## 🛠️ Comandi manuali

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

## 🔧 Deploy e interazione manuale

Se preferisci eseguire i passi uno alla volta:

### 1 — Avvia il nodo Hardhat locale (Terminale 1)
```bash
npm run node
```
Lascia questo terminale aperto per tutta la sessione.

### 2 — Deploy del contratto (Terminale 2)
```bash
npm run deploy:local
```

### 3 — Configura lo script di interazione
Apri `scripts/interact.js` e incolla l'indirizzo nella variabile:
```js
const CONTRACT_ADDRESS = "0x...indirizzo_dal_deploy";
```

### 4 — Esegui lo script di interazione
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
