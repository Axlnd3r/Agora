# Naskah video demo Agora

Target rekaman: sekitar 3–4 menit. Gunakan aplikasi lokal sampai deploy Vercel selesai. Pastikan jendela editor yang memuat `.env.local` atau `.env.deploy.local` tertutup sebelum perekaman.

## Persiapan di luar rekaman

1. Impor akun owner dari `DEPLOYER_PRIVATE_KEY` di `.env.deploy.local` ke MetaMask pada perangkat ini. Pastikan alamat publiknya `0xDcF6FA998Ba319eDf790e243E100C2f48210282E`. Jangan tampilkan kunci di video.
2. Pilih BNB Smart Chain Testnet, chain ID 97. Pastikan browser hanya membuka wallet testnet untuk demo.
3. Jalankan `npm run demo:chain` dan `npm run verify`. Periksa saldo tBNB owner dan relayer serta saldo mUSD vault. Nilai saldo saat rekaman bisa berbeda dari dokumen ini.
4. Jalankan `npm run dev` dan buka `http://localhost:3000` (atau `http://localhost:3100` jika memakai server demo yang sedang berjalan). Lakukan satu percobaan lengkap di luar rekaman. Setiap request baru yang berhasil menghabiskan 0.02 mUSD testnet. Jika halaman perlu di-refresh setelah pembayaran, formulir mengingat request ID dalam tab yang sama; pilih **New request** hanya jika ingin membayar untuk pemeriksaan berikutnya.
5. Siapkan tab BscScan untuk vault `0x2B40F649475B2833F5a61600bD069ea98C99260f` agar transaksi baru mudah diperlihatkan.

## Urutan rekaman

| Waktu | Layar | Narasi singkat |
| --- | --- | --- |
| 0:00–0:25 | Landing page | “Agora membatasi belanja sebuah agent lewat vault dan mandat di BNB Smart Chain Testnet. Token mUSD di sini hanya token uji.” |
| 0:25–1:05 | Hubungkan owner; dashboard dan mandat | “Owner mengisi vault, memilih agent serta merchant, lalu memberi batas total, harian, per pembayaran, dan masa berlaku. Mandat ini bisa di-pause atau dicabut.” Tunjukkan alamat owner dan mandat aktif. |
| 1:05–1:40 | Detail mandat dan halaman Run invoice check | “Layanan demo memeriksa aritmetika invoice IDR. Biaya layanan tetap 0.02 mUSD. Mode planner yang aktif terlihat di layar.” Tunjukkan **Gemini live** dan nama model yang tampil, serta agent, merchant, service ID, dan batas pembayaran. |
| 1:40–2:30 | Jalankan invoice check | Gunakan input bawaan, klik **Run paid invoice check**, lalu setujui pesan otorisasi owner di MetaMask. “Merchant mengirim HTTP 402 dengan quote bertanda tangan. Agent menandatangani payment intent, relayer menyelesaikan pembayaran melalui vault, baru hasil invoice dikirim.” Tunggu hasil serta tautan transaksi. |
| 2:30–3:10 | BscScan dan Activity | Buka transaksi baru dari tautan hasil. Tunjukkan status sukses, transfer mUSD ke merchant, dan event `PaymentSettled`. Kembali ke Activity untuk melihat catatan on-chain. |
| 3:10–3:45 | Batas dan penutup | “Demo ini membuktikan satu alur layanan berbayar dan retry berbasis bukti chain. Skema x402 `mandatepay` bersifat khusus Agora; layanan umum dengan skema `exact` belum langsung kompatibel. Kontrak belum diaudit.” |

Jika ingin memperlihatkan penolakan, pause mandat lalu coba **request baru**. Jelaskan bahwa penolakan terjadi sebelum pembayaran. Resume mandat sesudahnya. Jangan tampilkan layar private key, seed phrase, terminal dengan isi file env, atau notifikasi wallet lain.

Gemini live telah menghasilkan keputusan planner serta transaksi terkonfirmasi melalui browser wallet pada mesin demo. Pastikan mode yang tampil tetap **Gemini live** saat merekam; jika konfigurasi berubah menjadi fixture, sebut mode fixture sesuai layar. Panduannya ada di [`GEMINI_PLANNER.md`](GEMINI_PLANNER.md).

## Bukti yang bisa dicantumkan di deskripsi video

- Vault, token, dan kontrak lain: [`deployments/bsc-testnet.json`](../deployments/bsc-testnet.json).
- Mandat dan alamat signer publik: [`deployments/demo-testnet.json`](../deployments/demo-testnet.json).
- Contoh transaksi yang sudah terkonfirmasi: [fixture planner](https://testnet.bscscan.com/tx/0x53457be304fab2ad6e09a5018d5214faa08974b8ffa0465c56d9eaa6126409e4) dan [Gemini live melalui browser wallet](https://testnet.bscscan.com/tx/0x722b3afecb99e22888a7fe894711be27099b87d46befa546e31cc2372296f03e).

Gunakan tautan transaksi **baru dari rekaman** sebagai bukti utama. Transaksi di atas hanya contoh hasil uji sebelumnya.
