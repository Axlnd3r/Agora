# Naskah video demo Agora

Target rekaman: sekitar 3–4 menit. Gunakan [situs production](https://agora-nine-peach.vercel.app), bukan URL deployment yang berisi hash. Ikuti [PRD langkah demo berikutnya](PRD_NEXT_DEMO.md). Pastikan layar yang memuat `.env.local` atau `.env.deploy.local` tertutup sebelum perekaman.

## Persiapan di luar rekaman

1. Siapkan akun owner di MetaMask pada perangkat rekaman menggunakan backup wallet milik sendiri. Pastikan alamat publiknya `0xDcF6FA998Ba319eDf790e243E100C2f48210282E`. Jangan tampilkan atau kirim private key maupun seed phrase.
2. Pilih BNB Smart Chain Testnet, chain ID 97. Pastikan browser hanya membuka wallet testnet untuk demo.
3. Buka `/api/health` dan `/api/demo/config` pada situs production. Pastikan health `ok`, konfigurasi `ready: true`, dan planner `Gemini live`. Nilai saldo dapat berubah setelah pembayaran.
4. Buka situs production, sambungkan wallet, lalu pastikan `/app` menampilkan vault dan mandate. Lakukan satu rehearsal dari `/app/runs/new` sebelum rekaman. Setiap request baru yang berhasil menghabiskan 0.02 mUSD testnet. Jika request timeout setelah pembayaran dikirim, retry ID yang sama dengan invoice yang sama; pilih **New request** hanya jika memang ingin membayar lagi.
5. Siapkan tab BscScan untuk vault `0x2B40F649475B2833F5a61600bD069ea98C99260f` agar transaksi baru mudah diperlihatkan.

## Urutan rekaman

| Waktu | Layar | Narasi singkat |
| --- | --- | --- |
| 0:00–0:25 | Landing page | “Agora membatasi belanja sebuah agent lewat vault dan mandat di BNB Smart Chain Testnet. Token mUSD di sini hanya token uji.” |
| 0:25–1:05 | Hubungkan owner; dashboard dan mandat | “Owner mengisi vault, memilih agent serta merchant, lalu memberi batas total, harian, per pembayaran, dan masa berlaku. Mandat ini bisa di-pause atau dicabut.” Tunjukkan alamat owner dan mandat aktif. |
| 1:05–1:40 | Detail mandat dan halaman Run invoice check | “Layanan demo memeriksa aritmetika invoice IDR. Biaya layanan tetap 0.02 mUSD. Mode planner yang aktif terlihat di layar.” Tunjukkan **Gemini live** dan nama model yang tampil, serta agent, merchant, service ID, dan batas pembayaran. |
| 1:40–2:30 | Jalankan invoice check | Gunakan input bawaan, klik **Run paid invoice check**, lalu setujui pesan otorisasi owner di MetaMask. “Merchant mengirim HTTP 402 dengan quote bertanda tangan. Agent menandatangani payment intent, relayer menyelesaikan pembayaran melalui vault, baru hasil invoice dikirim.” Tunjukkan dialog sukses, hasil invoice, jumlah, dan tautan transaksi. |
| 2:30–3:10 | BscScan dan Activity | Buka transaksi baru dari tautan hasil. Tunjukkan status sukses, transfer mUSD ke merchant, dan event `PaymentSettled`. Kembali ke Activity untuk melihat catatan on-chain. |
| 3:10–3:45 | Batas dan penutup | “Demo ini membuktikan satu alur layanan berbayar dan retry berbasis bukti chain. Skema x402 `mandatepay` bersifat khusus Agora; layanan umum dengan skema `exact` belum langsung kompatibel. Kontrak belum diaudit.” |

Jika ingin memperlihatkan penolakan, pause mandat lalu coba **request baru**. Jelaskan bahwa penolakan terjadi sebelum pembayaran. Resume mandat sesudahnya. Jangan tampilkan layar private key, seed phrase, terminal dengan isi file env, atau notifikasi wallet lain.

Gemini live dan browser-wallet settlement sudah pernah diverifikasi secara lokal. Pembayaran dari domain production masih perlu dicoba sebelum rekaman. Pastikan mode yang tampil tetap **Gemini live**; jika berubah menjadi fixture, sebut mode fixture sesuai layar. Panduannya ada di [`GEMINI_PLANNER.md`](GEMINI_PLANNER.md).

## Bukti yang bisa dicantumkan di deskripsi video

- Vault, token, dan kontrak lain: [`deployments/bsc-testnet.json`](../deployments/bsc-testnet.json).
- Mandat dan alamat signer publik: [`deployments/demo-testnet.json`](../deployments/demo-testnet.json).
- Contoh transaksi yang sudah terkonfirmasi: [fixture planner](https://testnet.bscscan.com/tx/0x53457be304fab2ad6e09a5018d5214faa08974b8ffa0465c56d9eaa6126409e4) dan [Gemini live melalui browser wallet](https://testnet.bscscan.com/tx/0x722b3afecb99e22888a7fe894711be27099b87d46befa546e31cc2372296f03e).

Gunakan tautan transaksi **baru dari rekaman** sebagai bukti utama. Transaksi di atas hanya contoh hasil uji sebelumnya.
