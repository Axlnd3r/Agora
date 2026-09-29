# Deploy Agora ke Vercel

Agora adalah aplikasi Next.js dengan satu layanan berbayar di BNB Smart Chain Testnet. Repo GitHub digunakan sebagai sumber deployment; kontrak dan mandat demo sudah terpasang di chain 97.

## Impor repo

1. Di Vercel, pilih **Add New → Project** dan impor `Axlnd3r/Agora` dari GitHub.
2. Pakai root directory `./` dan preset **Next.js**. Build command bawaan `npm run build` sudah cukup.
3. Sebelum deploy, isi variabel **Environment Variables** di bawah. Pilih Production; tambahkan juga Preview jika ingin menjalankan paid demo pada preview deployment.

| Nama | Nilai yang disiapkan di Vercel |
| --- | --- |
| `AGORA_AGENT_PRIVATE_KEY` | Kunci signer agent dari `.env.local` di mesin demo. |
| `AGORA_MERCHANT_PRIVATE_KEY` | Kunci signer merchant dari `.env.local`. |
| `AGORA_RELAYER_PRIVATE_KEY` | Kunci relayer dari `.env.local`; alamatnya perlu tBNB untuk gas. |
| `AGORA_INTERNAL_TOKEN` | Token internal dari `.env.local` untuk panggilan layanan dalam aplikasi. |
| `SERVER_RPC_URL` | RPC HTTPS BSC Testnet yang dapat diakses Vercel, misalnya `https://bsc-testnet-rpc.publicnode.com`. |
| `AGORA_PLANNER_MODE` | `live` untuk demo Gemini; `fixture` hanya bila secara sengaja memakai planner fixture. |
| `GEMINI_API_KEY` | API key Gemini dari `.env.local`, hanya diperlukan untuk mode `live`. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` sesuai konfigurasi lokal yang sudah diuji. |

Jangan masukkan `DEPLOYER_PRIVATE_KEY` atau isi `.env.deploy.local` ke Vercel. Kunci owner tetap hanya di MetaMask pada perangkat demo. Semua kunci dan token di tabel adalah variabel server; jangan beri awalan `NEXT_PUBLIC_`.

Pakai ketiga signer yang cocok dengan [mandat demo](../deployments/demo-testnet.json). Signer baru dari `npm run demo:signers` tidak otomatis diizinkan oleh mandat yang sudah dibuat.

## Setelah deployment

1. Buka `/api/health` dan `/api/demo/config` pada domain Vercel. Pastikan konfigurasi demo siap dan planner yang tampil sesuai mode yang dipilih; endpoint config hanya menampilkan alamat publik.
2. Buka `/app` dan hubungkan MetaMask owner pada chain 97. Saldo vault dan mandat harus terbaca.
3. Jalankan satu invoice check baru dari `/app/runs/new`. Satu request baru yang berhasil membayar 0.02 test mUSD. Simpan tautan transaksi BscScan dari hasil dan periksa Activity.
4. Jika respons terlambat setelah pembayaran, ulangi request yang sama dari tab yang sama. Form menyimpan request ID dan isi invoice agar retry mengambil hasil pembayaran yang sudah ada. **New request** membuat pembayaran baru.

Rute `/api/runs` memanggil merchant di domain yang sama untuk challenge HTTP 402 dan delivery. Pada preview deployment dengan Vercel Authentication, cookie dari request browser diteruskan ke panggilan internal tersebut. Fungsi memakai `maxDuration = 60`; jika RPC, Gemini, atau konfirmasi chain melampaui durasi itu, ulangi request ID yang sama setelah transaksi terkonfirmasi.

Untuk narasi dan batas demo, lihat [runbook](DEMO.md) dan [naskah video](VIDEO_SCRIPT_ID.md).
