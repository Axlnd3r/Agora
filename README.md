# Agora

Agora is a BNB Smart Chain Testnet demo for bounded agent spending. An owner controls a vault and a mandate; one deterministic agent task buys an invoice-check service for 0.02 test mUSD.

An owner defines a mandate with an agent, merchant service, budget limits, and expiry. The `/app` workspace connects an injected browser wallet to the deployed BNB Smart Chain Testnet contracts and reads balances, vaults, mandates, and events directly from chain. Wallet actions include the DemoUSD faucet, vault creation and funding, mandate creation, and mandate pause, resume, and revoke.

The paid task uses an HTTP 402 challenge with a custom x402 v2 `mandatepay` scheme. A merchant signer issues an EIP-712 invoice, the configured agent signs a matching intent after the owner authorizes the run, and a separate relayer calls `MandateVault.settlePayment`. The merchant computes invoice arithmetic only after confirmed settlement. The planner supports a labeled fixture mode and a Gemini live mode. Four Gemini live payments have been verified end to end, including two through a browser wallet; there is no general merchant integration.

## Run locally

```bash
npm install
npm run demo:signers
npm run dev
```

Open `http://localhost:3000` for the landing page and `/app/runs/new` for the paid task. On this demo machine, `npm run demo:signers` leaves the existing ignored `.env.local` credentials intact. A fresh set of signers on another machine will not match the seeded testnet mandate; create a mandate for those public signer addresses before running the paid task. The demo owner wallet is separate and stays in `.env.deploy.local`; never upload that owner key to the web server.

See [docs/DEMO.md](docs/DEMO.md) for wallet setup, the testnet run, and recovery. The Indonesian recording sequence is in [docs/VIDEO_SCRIPT_ID.md](docs/VIDEO_SCRIPT_ID.md).
GitHub-to-Vercel setup and the server-only environment variable list are in [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).
To configure the Gemini planner with a locally stored API key, follow [docs/GEMINI_PLANNER.md](docs/GEMINI_PLANNER.md). Fixture mode remains available for demos without a model API key.

Verify the web build and contract artifacts together:

```bash
npm run verify
```

## Included flows

- Public product narrative and control-flow architecture
- Wallet connection and BNB Testnet network switching
- Live DemoUSD, vault balances, faucet, vault creation, deposits, and free withdrawals
- On-chain mandate creation, pause, resume, revoke, and event-backed mandate views
- Activity ledger built from vault contract events and BscScan transaction links
- One paid invoice-check service: HTTP 402, merchant quote, agent intent, vault settlement, delivery result, and chain-backed retry
- Solidity source for DemoUSD, VaultFactory, and MandateVault
- Deployment manifests at `deployments/bsc-testnet.json` and `deployments/demo-testnet.json`

## Product boundaries

- BNB Smart Chain Testnet only
- mUSD is a demo token with no monetary value
- Contract wallet actions are limited to BNB Smart Chain Testnet
- The x402 transport uses a project-specific `mandatepay` scheme; generic `exact` clients and public facilitators are not compatible automatically
- The demo supports fixture and Gemini live planner modes for one invoice-check service; the model never chooses recipient, token, price, or contract call
- Retry recovery reads the chain and recomputes a deterministic result; there is no separate durable application database or queue
- Contract source compiles and its ABI is checked, but EVM runtime, fuzz, and invariant tests are not complete
- Contracts are not audited

## Deployed contract source

The deployed `DemoUSD`, `VaultFactory`, and `MandateVault` sources are published on Sourcify with exact bytecode matches. Open the Sourcify records and BscScan code tabs from [`deployments/bsc-testnet.json`](deployments/bsc-testnet.json). Re-submit or re-check using `npm run verify:sourcify`.

See [docs/PROGRESS.md](docs/PROGRESS.md) for deployment and verification evidence and [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) for visual rationale.

## Lanjutkan dari perangkat lain

Panduan ini menyamakan cara kerja saat proyek dilanjutkan dengan coding agent atau editor lain.

### Prasyarat

- Git
- Node.js 20.9.0 atau lebih baru
- npm
- Editor atau coding agent pilihan Anda

Di PowerShell Windows, gunakan `npm.cmd` bila kebijakan eksekusi memblokir perintah `npm`.

### Ambil dan jalankan proyek

```bash
git clone https://github.com/Axlnd3r/Agora.git
cd Agora
npm ci
```

Buat konfigurasi lokal tanpa memasukkan rahasia ke Git. Untuk menguji alur paid task pada perangkat lain, buat signer server baru dan mandat baru yang mengizinkan alamat agent serta merchant tersebut:

```powershell
npm run demo:signers
```

Jangan pernah memasukkan private key, URL RPC privat, `.env.local`, atau `.env.deploy.local` ke commit. File deployment owner lokal tidak pernah diperlukan oleh frontend atau Vercel.

Jalankan aplikasi dan pemeriksaan sebelum mengubah kode:

```bash
npm run dev
npm run verify
```

Landing page tersedia di `http://localhost:3000`; ruang kerja demo tersedia di `http://localhost:3000/app`.

### Cara bekerja dengan coding agent

Mulai setiap sesi dari akar repositori. Minta agent membaca `AGENTS.md`, `README.md`, `docs/PROGRESS.md`, dan bagian relevan dalam `MandatePay_PRD_Blueprint.md` sebelum membuat perubahan. Berikan satu target kecil per sesi, misalnya menambah test kontrak atau menyambungkan satu layar ke data nyata.

Sebelum menerima perubahan, jalankan `npm run verify`, buka alur yang diubah, dan pastikan status testnet cocok dengan data on-chain. Jangan meminta agent membuat klaim audit atau transaksi bila bukti tersebut belum ada.

### Urutan pekerjaan yang disarankan

1. Tambahkan Foundry, lalu tulis unit test, fuzz test, invariant test, dan integrasi Anvil untuk saldo terreservasi, lifecycle mandate, batas belanja, serta verifikasi signature.
2. Tambahkan penyimpanan durable, queue, dan rekonsiliasi transaksi yang aman untuk concurrency dan kegagalan RPC.
3. Tambahkan planner LLM terstruktur dan uji live sebelum mengklaim integrasi AI.
4. Uji interoperabilitas adapter `mandatepay` dan perluas merchant sesuai blueprint.

### Commit dan push

Sebelum bekerja, ambil perubahan terbaru agar riwayat lokal tidak tertinggal:

```bash
git pull --ff-only origin main
```

Setelah verifikasi lulus, periksa perubahan dan buat commit yang menjelaskan satu perubahan terpisah:

```bash
git status
git add <file-yang-diubah>
git commit -m "feat: jelaskan perubahan singkat"
git push origin main
```

Untuk perubahan pertama pada perangkat baru, setel identitas commit pada repositori ini:

```bash
git config user.name "Axlnd3r"
git config user.email "alexandermatt524@gmail.com"
```

Jika `git pull --ff-only` menolak karena ada riwayat yang berbeda, jangan memaksa push. Simpan perubahan Anda, periksa perbedaan dengan `git log --oneline --graph --all`, lalu selesaikan konflik secara sadar sebelum menjalankan verifikasi dan push kembali.
