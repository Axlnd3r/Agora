# Agora

Agora is a hackathon MVP for the Finance & Commerce and AI Agents tracks. It presents a bounded spending workflow for AI agents on BNB Smart Chain Testnet.

An owner defines a mandate with an agent, merchant service, budget limits, and expiry. The intended settlement flow binds each payment to that mandate. The current workspace is a frontend demonstration with clearly labelled synthetic fixture data. It does not connect a wallet, deploy contracts, or send a transaction.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the public landing page, then use the workspace at `/app`.

Verify the web build and contract artifacts together:

```bash
npm run verify
```

## Included flows

- Public product narrative and control-flow architecture
- Workspace overview with a labelled testnet fixture
- Mandate builder with authority, limits, and review stages
- Separate payment proof and delivery state
- Routes for vault setup, agents, mandates, runs, payments, and activity
- Solidity source for DemoUSD, VaultFactory, and MandateVault
- Local fixture API with validated run input and explicit loading, error, and empty states

## Product boundaries

- BNB Smart Chain Testnet only
- mUSD is a demo token with no monetary value
- No wallet is connected in this frontend demonstration
- Contract, indexer, merchant, relayer, and x402 services are not included yet
- Contract source compiles and its ABI is checked, but EVM runtime, fuzz, and invariant tests are not complete
- Contracts are not audited

See [docs/PROGRESS.md](docs/PROGRESS.md) for verification evidence and [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) for visual rationale.

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

Buat konfigurasi lokal tanpa memasukkan rahasia ke Git:

```powershell
Copy-Item .env.example .env.local
```

Isi hanya nilai yang diperlukan di `.env.local`. Jangan pernah memasukkan private key, URL RPC privat, atau `.env.local` ke commit.

Jalankan aplikasi dan pemeriksaan sebelum mengubah kode:

```bash
npm run dev
npm run verify
```

Landing page tersedia di `http://localhost:3000`; ruang kerja demo tersedia di `http://localhost:3000/app`.

### Cara bekerja dengan coding agent

Mulai setiap sesi dari akar repositori. Minta agent membaca `AGENTS.md`, `README.md`, `docs/PROGRESS.md`, dan bagian relevan dalam `MandatePay_PRD_Blueprint.md` sebelum membuat perubahan. Berikan satu target kecil per sesi, misalnya menambah test kontrak atau menyambungkan satu layar ke data nyata.

Sebelum menerima perubahan, jalankan `npm run verify`, buka alur yang diubah, dan pastikan label fixture atau testnet masih akurat. Jangan meminta agent membuat klaim audit, deployment, atau transaksi bila bukti tersebut belum ada.

### Urutan pekerjaan yang disarankan

1. Tambahkan Foundry, lalu tulis unit test, fuzz test, invariant test, dan integrasi Anvil untuk saldo terreservasi, lifecycle mandate, batas belanja, serta verifikasi signature.
2. Deploy dan verifikasi `DemoUSD`, `VaultFactory`, dan `MandateVault` di BNB Smart Chain Testnet. Simpan alamat kontrak dan hash transaksi sebagai konfigurasi publik yang dapat diperiksa.
3. Hubungkan wallet, typed-data signature, submit transaksi, serta rekonsiliasi receipt di frontend.
4. Ganti fixture API dengan penyimpanan durable dan indeks event kontrak. Tambahkan merchant, adapter x402, facilitator, dan relayer sesuai blueprint.

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
