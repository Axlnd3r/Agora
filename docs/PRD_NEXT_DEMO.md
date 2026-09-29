# PRD: Demo Agora berikutnya

**Diperbarui:** 29 September 2026  
**Status:** Situs production sudah live; transaksi dari browser pada deployment dan rekaman video masih perlu dilakukan.

## Tujuan

Merekam walkthrough 3–4 menit dari perangkat rumah yang menunjukkan satu pembayaran invoice-check selesai melalui aplikasi Agora yang di-host di Vercel. Penonton harus dapat melihat mode Gemini live, otorisasi owner, hasil layanan, bukti settlement di BNB Smart Chain Testnet, dan batas demo dengan jelas.

## Kondisi saat ini

- Situs publik: [agora-nine-peach.vercel.app](https://agora-nine-peach.vercel.app). Gunakan domain ini, bukan URL deployment yang berisi hash.
- `/api/health` menjawab `status: ok`; `/api/demo/config` menjawab `ready: true` dan planner `live` (`gemini-3.5-flash-lite`).
- Halaman utama dan `/app/runs/new` sudah diperiksa merespons HTTP 200.
- Repo GitHub `main` terhubung ke Vercel. Build production terbaru berstatus Ready.
- Environment server sudah diisi sebagai secret Vercel. Jangan pindahkan nilai key ke dokumen, chat, screenshot, atau video.
- Belum ada pembayaran yang dijalankan dari browser pada domain production setelah deployment. Itu adalah pemeriksaan teknis pertama yang masih harus dilakukan sebelum merekam.

## Alur demo yang dituju

1. Buka domain production dan jelaskan bahwa mUSD hanya token testnet tanpa nilai uang.
2. Sambungkan akun owner pada BNB Smart Chain Testnet, chain ID `97`. Pastikan alamat wallet yang tersambung adalah akun demo yang tercantum di [`demo-testnet.json`](../deployments/demo-testnet.json).
3. Tunjukkan Overview, vault, dan mandate aktif. Jika saldo atau mandate gagal dimuat, bereskan koneksi wallet sebelum memulai pembayaran.
4. Buka **Paid task demo** dan pastikan layar menampilkan Gemini live. Gunakan invoice bawaan: `2 × 100000 IDR` dengan total yang dinyatakan `200000`.
5. Klik **Run paid invoice check** dan setujui pesan otorisasi di MetaMask. Merchant meminta pembayaran melalui HTTP 402, agent menandatangani intent, relayer menyelesaikan settlement di vault, lalu layanan mengembalikan hasil.
6. Tunjukkan dialog sukses: total cocok, hasil hitung `200000`, nilai invoice `200000`, jumlah `0.02 mUSD`, dan tautan transaksi.
7. Buka transaksi baru tersebut di BscScan, perlihatkan transfer dan event `PaymentSettled`, lalu kembali ke Activity.
8. Rekam walkthrough dan simpan hash transaksi yang benar-benar muncul di rekaman.

## Langkah berikutnya

- [ ] Di perangkat rumah, buka MetaMask dan pulihkan atau impor akun owner melalui backup wallet milik sendiri. Jangan kirim private key atau seed phrase lewat chat atau Git. Cocokkan alamat publik dengan manifest sebelum lanjut.
- [ ] Pilih BNB Smart Chain Testnet (chain 97), buka [situs production](https://agora-nine-peach.vercel.app), lalu sambungkan akun owner.
- [ ] Periksa `/api/health` dan `/api/demo/config`; lanjutkan hanya jika layanan siap dan planner menunjukkan Gemini live.
- [ ] Pastikan Overview menampilkan vault dan mandate aktif. Buka halaman Paid task demo dan lakukan satu rehearsal dengan invoice bawaan.
- [ ] Verifikasi dialog sukses, transaksi di BscScan, dan catatan Activity. Gunakan hash baru ini sebagai bukti untuk video.
- [ ] Rekam 3–4 menit memakai urutan di [`VIDEO_SCRIPT_ID.md`](VIDEO_SCRIPT_ID.md). Tutup file `.env`, terminal, private key, seed phrase, dan notifikasi pribadi sebelum mulai.

Satu request baru yang berhasil membayar `0.02 mUSD` testnet. Rehearsal dan pengambilan video dapat berarti dua pembayaran. Jika respons terlambat setelah transaksi dikirim, ulangi request ID yang sama dengan invoice yang sama; jangan pilih **New request** kecuali memang ingin membayar lagi. Detail pemulihan ada di [`DEMO.md`](DEMO.md).

## Kriteria selesai

- Domain production terbuka tanpa login Vercel; gunakan alias publik `agora-nine-peach.vercel.app`.
- Wallet tersambung di chain 97, vault dan mandate tampil, serta UI menunjukkan Gemini live.
- Satu request dari situs production menghasilkan settlement `0.02 mUSD` dan hasil invoice `200000 = 200000`.
- Dialog sukses menampilkan hash transaksi yang sama dengan transaksi BscScan dan aktivitas vault.
- Video 3–4 menit memperlihatkan alur itu tanpa membuka rahasia wallet atau server.
- Narasi menyebut batasnya: satu layanan invoice-check synthetic, mUSD testnet tanpa nilai uang, skema x402 `mandatepay` khusus Agora, dan kontrak belum diaudit.

## Jika ada kendala

- **Wallet atau jaringan salah:** hentikan alur, pilih chain 97, sambungkan ulang akun owner, lalu periksa alamat.
- **Endpoint belum siap atau planner bukan live:** jangan kirim request pembayaran; catat pesan yang tampil dan minta perbaikan deployment.
- **Saldo gagal dimuat:** coba Retry atau refresh setelah memastikan wallet berada di chain 97. Jangan menyebut saldo lama sebagai kondisi terbaru.
- **Request timeout sesudah transaksi dikirim:** tunggu konfirmasi dan retry request ID yang sama dengan isi invoice yang sama. Jangan buat request baru untuk memulihkan hasil.
- **Pembayaran production belum berhasil:** jangan menyebut walkthrough sebagai pembayaran live. Transaksi terdahulu di runbook boleh dipakai sebagai bukti historis dengan label yang jelas.

## Di luar lingkup demo ini

Mainnet atau uang sungguhan, layanan merchant umum, pembayaran selain invoice-check yang didukung, audit kontrak, dan klaim bahwa Gemini menentukan nominal atau penerima pembayaran.

## Referensi

- [Runbook demo](DEMO.md)
- [Naskah video bahasa Indonesia](VIDEO_SCRIPT_ID.md)
- [Status implementasi](PROGRESS.md)
