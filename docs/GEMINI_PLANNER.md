# Gemini planner untuk demo Agora

Agora bisa berjalan dalam mode `fixture` tanpa API key atau mode `live` dengan Gemini. Adapter `live` memakai Gemini hanya untuk memilih apakah teks tugas sesuai layanan `invoice-check:v1`. Alamat merchant, token, harga, batas mandat, dan tanda tangan tetap diperiksa oleh kode dan kontrak. Jika Gemini gagal pada request baru, run berhenti sebelum menandatangani pembayaran; sistem tidak beralih diam-diam ke fixture. Retry untuk request yang sudah dibayar memulihkan hasil dari chain tanpa memanggil planner lagi.

## Aktifkan di perangkat demo

1. Buat key dari [Google AI Studio](https://aistudio.google.com/app/apikey). Periksa batas dan model yang tersedia pada project Anda di [dokumentasi billing Gemini](https://ai.google.dev/gemini-api/docs/billing). Free Tier tersedia untuk model tertentu; kuotanya bergantung pada akun dan model.
2. Buka `.env.local` pada perangkat ini, tambahkan `GEMINI_API_KEY=<nilai-key>` dan `AGORA_PLANNER_MODE=live`. Biarkan `GEMINI_MODEL=gemini-3.5-flash-lite` atau tambahkan baris tersebut jika belum ada. Jangan menaruh key di variabel `NEXT_PUBLIC_`, chat, commit, atau rekaman.
3. Restart server Next.js. Buka `/api/demo/config` dan pastikan `planner.mode` bernilai `live` serta `ready` bernilai `true`.
4. Jalankan satu invoice-check dengan tugas bawaan. Hasil UI harus menampilkan **Gemini live**, model yang dipakai, transaksi pembayaran baru, dan hasil layanan. Request baru yang berhasil tetap membayar 0.02 mUSD testnet. Uji CLI live terakhir berhasil dengan transaksi [`0x8de4…d18b`](https://testnet.bscscan.com/tx/0x8de4526cbadb0617c35a8a12250af1b77a0d25071ad8ee45124bd875b81fd18b).

Jika key belum tersedia, biarkan `AGORA_PLANNER_MODE=fixture` atau hapus barisnya. UI akan menampilkan **fixture (deterministic)**. Untuk mengganti mode setelah server berjalan, restart server.

Free Tier menurut [tabel harga Gemini](https://ai.google.dev/gemini-api/docs/pricing) dapat memakai input dan output untuk meningkatkan produk Google. Demo ini hanya mengirim teks tugas singkat yang bersifat sintetis; jangan masukkan data invoice asli pada Free Tier. Batas dan ketersediaan model dapat berubah, jadi cek AI Studio saat membuat key.
