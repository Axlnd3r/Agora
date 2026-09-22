# MandatePay — Frontend Design & Implementation Specification

Versi: 1.0  
Tanggal: 21 September 2026  
Target: Next.js App Router, desktop dan mobile  
Referensi visual: cinematic dark AI-infrastructure landing page dari pengguna  
Status: spesifikasi implementasi; bukan bukti bahwa frontend telah dibuat.

> MandatePay memakai komposisi hitam sinematik, tipografi putih/silver, video full-bleed, dan CTA berbentuk pill pada landing page. Konten serta interaksinya menjelaskan MandatePay sebagai spending-control layer untuk AI agents—bukan payment gateway generik.

Dokumen ini melengkapi `docs/PRD_BLUEPRINT.md`. Jika terjadi konflik, aturan finansial, keamanan, status transaksi, dan source of truth pada PRD mempunyai prioritas lebih tinggi daripada keputusan visual.

## 1. Penempatan dokumen

Jangan menyalin seluruh prompt referensi ke `README.md`. Prompt tersebut meminta satu `index.html`, fixed viewport, overflow hidden, logo partner dummy, dan copy produk berbeda. Itu bertentangan dengan arsitektur Next.js serta kebutuhan dashboard MandatePay.

| File | Fungsi |
|---|---|
| `README.md` | Ringkasan produk, screenshot aktual, quick start, tautan dokumentasi |
| `docs/PRD_BLUEPRINT.md` | Requirement produk, kontrak, backend, keamanan, dan milestone |
| `docs/UI_DESIGN_SPEC.md` | Dokumen ini: copy, visual system, routes, components, responsive, accessibility, acceptance |
| `docs/PROGRESS.md` | Status implementasi aktual dan evidence |
| `apps/web/` | Source frontend Next.js |

Keputusan UI yang mengikat:

- Landing page publik memakai estetika referensi.
- Dashboard aplikasi tidak memakai video sebagai background data finansial.
- Tidak ada logo partner palsu. Technology labels tidak dipresentasikan sebagai partnership.
- Jangan menyalin brand mark referensi; buat identitas MandatePay sendiri.
- Hero video hanya dekoratif dan tidak membawa informasi wajib.
- Animasi tidak boleh menyamarkan pending, failure, atau testnet status.
- Global body tetap scrollable; hanya hero yang boleh melakukan clipping visual.

## 2. Positioning dan copy

### 2.1 Metadata

```text
Title: MandatePay — Spending Control for AI Agents
Description: Give AI agents permission to purchase digital services through on-chain spending mandates without giving them unrestricted access to your wallet.
```

Open Graph image dibuat dari implementasi MandatePay. Jangan memakai screenshot situs referensi sebagai aset publik.

### 2.2 Header

| Elemen | Copy / target |
|---|---|
| Brand | Mark MandatePay + accessible label `MandatePay home` |
| How It Works | `/#how-it-works` |
| Security | `/#security` |
| Architecture | `/#architecture` |
| Docs | Hanya tampil jika link dokumentasi tersedia |
| Primary CTA | `Launch App` → `/app` |

### 2.3 Hero

Headline desktop:

```text
The Spending Layer
for AI Agents
```

Subcopy:

```text
Create on-chain spending mandates that let autonomous agents pay for
digital services without unrestricted access to your wallet.
```

Actions:

- `Launch App` → `/app`
- `View Architecture` → `/#architecture`

Eyebrow opsional: `PROGRAMMABLE SPENDING AUTHORITY`.

Jangan memakai klaim “secure”, “trustless”, “instant”, “gasless”, atau “production-ready” tanpa qualifier dan evidence. Label testnet terlihat sebelum pengguna masuk aplikasi.

### 2.4 Technology strip

Ganti empat logoipsum dengan label faktual:

1. `BNB Smart Chain Testnet`
2. `Custom x402 Scheme`
3. `On-chain Spending Limits`
4. `Verifiable Payment Receipts`

Gunakan text marks atau ikon generik buatan proyek. Logo resmi hanya digunakan jika ketentuan brand mengizinkan dan tidak memberi kesan endorsement.

### 2.5 Konten setelah hero

Landing page boleh scroll. Setelah first viewport, tampilkan tiga langkah:

1. `Set the mandate` — Owner menetapkan budget, merchant, service, jumlah transaksi, dan expiry.
2. `Let the agent purchase` — Agent memilih layanan; deterministic executor membentuk authorization.
3. `Verify every payment` — Kontrak menegakkan mandat; owner melihat receipt dan delivery sebagai status berbeda.

Security statement:

```text
Even if the agent is compromised, the vault rejects spending outside the mandate.
```

Qualifier permanen:

```text
Hackathon MVP on BNB Smart Chain Testnet. Demo token has no monetary value. Contracts are not audited.
```

## 3. Information architecture

### 3.1 Marketing routes

| Route | Fungsi |
|---|---|
| `/` | Landing page dan entry point produk |
| `/#how-it-works` | Tiga langkah penggunaan |
| `/#security` | Negative cases dan batas kemampuan agent |
| `/#architecture` | Diagram owner → mandate → agent → merchant → receipt |
| `/demo` | Opsional: guided public demo dengan data sintetis |

### 3.2 Application routes

Semua route aplikasi memakai layout terpisah tanpa full-screen video:

| Route | Tujuan |
|---|---|
| `/app` | Dashboard vault, budget, dan recent activity |
| `/app/setup` | Wallet, network, login, create vault, deposit |
| `/app/agents` | Agent provisioning |
| `/app/mandates` | Daftar mandat |
| `/app/mandates/new` | Form dan review mandat |
| `/app/mandates/[id]` | Budget, permissions, lifecycle, activity |
| `/app/runs/new` | Membuat task agent |
| `/app/runs/[id]` | Timeline planning, payment, delivery |
| `/app/payments/[id]` | Bukti pembayaran dan delivery |
| `/app/activity` | Filterable activity list |

## 4. Visual system

### 4.1 Arah visual

- Premium, cinematic, restrained.
- Black void stage dengan white/silver typography.
- Tidak ada purple glow, neon orb, glass cards massal, atau gradient dekoratif sebagai visual utama.
- Portal/door of light menggambarkan controlled access.
- First viewport mempunyai satu fokus; tidak ada statistik palsu, token price, badge promosi, atau partner carousel.

### 4.2 Color tokens

```css
:root {
  --mp-bg: #050505;
  --mp-surface: #0c0c0c;
  --mp-surface-raised: #121212;
  --mp-border: rgba(255, 255, 255, 0.12);
  --mp-ink: #fafafa;
  --mp-muted: #a7a6a6;
  --mp-nav: #b6b5b5;
  --mp-strip: #8b8a8a;
  --mp-pill: #ffffff;
  --mp-pill-ink: #050505;
  --mp-success: #79d49b;
  --mp-warning: #e8c56a;
  --mp-danger: #ee7f7f;
  --mp-info: #8fb7df;
  --mp-focus: #ffffff;
}
```

Semantic colors digunakan pada dashboard. Status selalu mempunyai icon/text dan tidak mengandalkan warna saja.

### 4.3 Typography

Primary font: Manrope variable 200–800 melalui `next/font/google` atau local WOFF2 yang berlisensi.

```css
font-family: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
```

Tidak perlu `IpsumMark` karena logoipsum dihapus. Nilai token dan transaction identifier menggunakan monospace dengan tabular numbers.

- Desktop headline: 64–72 px responsive, weight 400, line-height 1.1.
- Desktop body: 18–21 px, line-height 1.25.
- CTA: 18–20 px, weight 500.
- Mobile headline: clamp 42–56 px.
- Touch targets: minimum 44×44 CSS px.

### 4.4 Spacing dan shape

- Marketing max content width: 1440 px.
- Desktop horizontal padding: `clamp(24px, 5vw, 76px)`.
- Mobile horizontal padding: 20–24 px + safe-area inset.
- Primary button radius: 999 px.
- Dashboard controls boleh radius 10–14 px; hindari semua panel menjadi floating glass cards.

## 5. Cinematic landing page

### 5.1 First viewport

First viewport berisi tepat: brand, navigation, header CTA, satu headline, satu subcopy, dua actions, full-bleed video, technology strip, dan label BSC Testnet.

Gunakan reference canvas 1487×1058 untuk visual regression:

```css
:root {
  --u: calc(100svh / 1058);
  --uw: calc(100vw / 1487);
  --hero-scale: clamp(
    var(--u),
    calc(var(--u) * 0.65 + var(--uw) * 0.35),
    calc(var(--u) * 1.16)
  );
}
```

Hero memakai `min-height: 100svh` dan `overflow: clip`. Jangan menetapkan `overflow: hidden` pada seluruh body karena halaman harus scroll, dapat dizoom, dan semua focusable content harus terjangkau.

### 5.2 Video

Prototype URL yang diberikan pengguna:

```text
https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4
```

Gunakan URL tersebut hanya untuk prototype bila hak pakai dan ketersediaannya telah dikonfirmasi. Sebelum deployment publik:

1. Konfirmasi lisensi/hak penggunaan.
2. Simpan aset yang diizinkan pada storage milik tim atau `public/media`.
3. Buat poster WebP/AVIF yang berhak digunakan.
4. Catat sumber/lisensi di `docs/ASSET_LICENSES.md`.
5. Bila hak tidak jelas, ganti video orisinal dengan art direction serupa.

```tsx
<video
  className={styles.video}
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  poster="/media/mandatepay-hero-poster.webp"
  aria-hidden="true"
>
  <source src="/media/mandatepay-hero.mp4" type="video/mp4" />
</video>
```

Video dekoratif mempunyai poster/fallback ketika autoplay, data saver, error, atau reduced motion menahannya. Jangan preload seluruh video pada mobile.

Baseline desktop:

```css
.video {
  position: absolute;
  left: 50%;
  top: calc(1 * var(--u));
  width: calc(1492 * var(--u));
  height: calc(1054 * var(--u));
  transform: translateX(calc(-50% - 0.5 * var(--u)));
  object-fit: cover;
  pointer-events: none;
}
```

Pada portrait: inset 0, width/height 100%, transform none, object-position sekitar 43% center. Final framing ditentukan melalui visual regression karena video pengganti dapat berbeda.

### 5.3 Overlay dan anchors

Gunakan bottom fade menuju `--mp-bg` dan side fade di belakang copy. Test contrast body/CTA pada beberapa timestamp video, bukan poster saja.

| Elemen | Desktop baseline |
|---|---|
| Brand | left 75u, top 27u, visual sekitar 32×49u |
| Nav | centered, top sekitar 51u |
| Header CTA | right 75u, top 27u, sekitar 175×49u |
| Headline | left 75u, top sekitar 230u |
| Subcopy | mengikuti headline dengan gap visual 22–30u |
| Actions | mengikuti subcopy dengan gap 28–36u |
| Technology strip | centered, bottom safe-area 28–48u |

Copy MandatePay berbeda panjang dari referensi. Fidelity dinilai dari hierarchy, balance, dan anchors, bukan memaksa text overflow agar angka pixel identik.

### 5.4 Mobile menu

- Hide desktop nav/header CTA pada portrait.
- Burger berupa frosted pill/circle dengan visible focus.
- Sinkronkan `aria-expanded`, `aria-controls`, dan accessible label.
- Close pada Escape, menu link, route change, dan resize landscape.
- Focus masuk ke menu dan kembali ke burger saat ditutup.
- Gunakan focus trap/inert yang teruji dan pulihkan scroll pada close/unmount.
- Terapkan safe-area inset pada header serta menu foot.

## 6. Application UI

Landing page menjual ide; application UI membuktikan kontrol finansial.

### 6.1 App shell

- Header: MandatePay, BSC Testnet badge, abbreviated wallet, network state.
- Navigation: Overview, Vault, Agents, Mandates, Runs, Activity.
- Main content maximum sekitar 1280 px.
- Background gelap, surface sederhana, border tipis, tanpa video.

### 6.2 Dashboard hierarchy

1. Testnet warning.
2. Vault balance: total, reserved, free.
3. Active mandate budget dan status.
4. Run/payment requiring attention.
5. Recent confirmed activity.

Saldo menampilkan symbol `mUSD`, amount manusia, serta tooltip atomic amount bila dibutuhkan. Jangan menampilkan nilai fiat untuk token demo.

### 6.3 Mandate builder

Gunakan tiga tahap:

1. `Authority` — agent, merchant/service, validity.
2. `Limits` — total, daily, per-payment, max payments.
3. `Review & Sign` — ringkasan, free balance, gas, immutable-field warning.

Review harus menjawab siapa agent-nya, siapa yang boleh dibayar, service apa, limit, masa berlaku, efek pause/revoke, dan transaksi wallet yang ditandatangani.

### 6.4 Run dan payment timeline

```text
Task accepted → Planned → Quote received → Authorized → Submitted
→ Confirmed payment → Service processing → Delivered
```

Pending tidak memakai check icon. Jika payment confirmed tetapi delivery gagal, tampilkan keduanya secara eksplisit. Jangan mengubah status menjadi confirmed dengan timer frontend.

### 6.5 Proof drawer

Tampilkan evidence source, chain, vault, merchant, token, amount, identifiers, transaction/block link, dan confirmation watermark. Redact signature, raw transaction, bearer token, encrypted field, prompt privat, serta invoice privat.

## 7. Component architecture

```text
apps/web/
  app/
    (marketing)/
      layout.tsx
      page.tsx
    (application)/
      app/
        layout.tsx
        page.tsx
        setup/page.tsx
        agents/page.tsx
        mandates/page.tsx
        mandates/new/page.tsx
        mandates/[id]/page.tsx
        runs/new/page.tsx
        runs/[id]/page.tsx
        payments/[id]/page.tsx
        activity/page.tsx
    globals.css
  components/
    marketing/
      cinematic-hero.tsx
      marketing-header.tsx
      mobile-menu.tsx
      technology-strip.tsx
      how-it-works.tsx
      security-proof.tsx
      architecture-section.tsx
    app-shell/
      app-header.tsx
      app-navigation.tsx
      testnet-banner.tsx
    mandate/
      mandate-builder.tsx
      mandate-review.tsx
      budget-breakdown.tsx
    payment/
      payment-timeline.tsx
      payment-status.tsx
      proof-drawer.tsx
    primitives/
      button.tsx
      dialog.tsx
      status-badge.tsx
      skeleton.tsx
  styles/
    marketing.module.css
    application.css
  public/media/
    mandatepay-hero-poster.webp
```

Jangan menaruh seluruh landing dalam satu component besar atau membuat seluruh app client component. Wallet, mobile menu, live polling, dialog, dan transaction actions adalah client components kecil; shell/static marketing dapat memakai server components.

## 8. State dan data integration

- TanStack Query untuk API server state; wagmi/viem untuk wallet/chain.
- Local reducer cukup untuk form bertahap bila tidak perlu global store.
- Query key selalu owner/vault scoped.
- Chain status tidak optimistic: confirmed hanya dari receipt/indexer sesuai PRD.
- Account/chain change meng-invalidate query, menghentikan polling lama, dan meminta re-auth bila perlu.
- SSE boleh digunakan; polling tetap fallback dengan backoff dan visibility awareness.
- Amount JSON berupa decimal integer string, diubah ke bigint dan diformat memakai decimals manifest. Jangan memakai JavaScript `number` untuk arithmetic token.

## 9. Motion

Easing: `cubic-bezier(.22, 1, .36, 1)`.

- brand/nav/header CTA: fade/rise 0.8 s;
- headline: 0.9 s, delay 0.06 s;
- subcopy: 0.9 s, delay 0.14 s;
- CTA: 0.9 s, delay 0.22 s;
- technology strip: fade 1.1 s, delay 0.34 s.

Motion hanya pada `prefers-reduced-motion: no-preference`. Reduced motion meniadakan entrance translation, menyederhanakan menu transition, dan memakai poster/pause bila diperlukan. Animasi tidak boleh menunda error atau memberi impresi transaksi sudah selesai.

## 10. Responsive requirements

| Mode | Kondisi awal | Perilaku |
|---|---|---|
| Wide/landscape | aspect ratio > 1.1 dan width memadai | Absolute hero composition, centered nav, technology row |
| Tablet portrait | ≥600 px dan aspect ratio ≤1.1 | Flow layout, two-line headline, four labels satu row bila muat |
| Phone | <600 px / narrow portrait | Flow layout, burger, headline wrap, labels 2×2 |

Test minimal: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, dan 1487×1058. Test zoom 200%; tidak boleh ada CTA/focus terpotong.

## 11. Accessibility

- Satu `h1`, heading order benar, dan skip link.
- Visible focus minimum 2 px.
- Semua action keyboard-operable.
- Dialog/menu focus management diuji.
- Icon button mempunyai accessible name.
- Copy wallet/tx diumumkan melalui polite live region.
- Decorative video/SVG `aria-hidden`; diagram informatif mempunyai text alternative.
- Form error memakai `aria-describedby` dan error summary.
- Status bukan hanya warna.
- Autoplay selalu muted dan mempunyai reduced-motion/static fallback.
- Contrast diuji terhadap berbagai frame video.

Target minimum WCAG 2.2 AA untuk flow P0.

## 12. Performance dan reliability

- Poster dan critical copy tampil tanpa menunggu video.
- Manrope dioptimalkan melalui next/font/local subset.
- Mobile menu tidak membutuhkan animation library besar.
- Lazy-load section di bawah fold bila bermanfaat.
- Wallet libraries dimuat hanya pada route yang membutuhkan bila memungkinkan.
- Video error tidak menghilangkan headline/CTA.
- CSP hanya membuka RPC/wallet/video origin yang dipakai; jangan `*`.

Target awal yang harus diukur pada production build:

| Metrik | Target internal |
|---|---|
| Lighthouse Accessibility | ≥95 pada landing dan core app pages |
| CLS | <0.1 |
| LCP | <2.5 s pada environment yang dicatat; video bukan LCP target |
| Initial marketing JS | Minimal dan dicatat dari build output |

Target bukan klaim publik sebelum benar-benar diukur.

## 13. Testing dan visual QA

### 13.1 Component/E2E

- Burger/menu accessibility dan focus return.
- Amount/limit formatting dari bigint.
- Seluruh payment/delivery status mappings.
- Proof redaction dan explorer validation.
- Wrong network, expired session, empty/loading/error.
- Mandate review menolak invalid limits.
- Submitted tidak menjadi confirmed berdasarkan timer.
- Confirmed payment + failed delivery tampil terpisah.
- Account/network switch membersihkan state owner lama.
- Reduced motion meniadakan motion dan menyediakan media fallback.

### 13.2 Visual regression

Ambil screenshot delapan viewport untuk hero poster deterministik, mobile menu, dashboard populated/empty/error, mandate review, serta payment confirmed/rejected/unknown/delivery-failed.

Video membuat screenshot flaky. Automated visual test memakai poster/mock media; lakukan review manual video nyata terpisah.

## 14. Acceptance criteria

- [ ] Landing menyebut spending control untuk AI agents, bukan payment gateway.
- [ ] First viewport mengikuti hierarchy referensi tanpa menyalin brand/logo dummy.
- [ ] `Launch App` menuju onboarding/application yang berfungsi.
- [ ] Mobile menu, keyboard, focus, reduced motion, safe area bekerja.
- [ ] Video gagal tanpa menghilangkan content/CTA.
- [ ] Testnet/demo-token/not-audited disclaimer terlihat.
- [ ] Dashboard tidak memakai video di belakang data finansial.
- [ ] Amount berasal dari integer string/bigint dan decimals manifest.
- [ ] Payment, confirmation, dan delivery tetap terpisah.
- [ ] Pending/unknown/reorged tidak terlihat sukses.
- [ ] Proof memakai evidence nyata dan tidak membocorkan secret.
- [ ] Tidak ada partnership/security claim tanpa bukti.
- [ ] Build, typecheck, accessibility, E2E, dan visual evidence dicatat.

## 15. README section

Tambahkan setelah UI benar-benar ada. README tidak perlu menampung seluruh spesifikasi.

```markdown
## Frontend

MandatePay uses a cinematic public landing page and a separate transaction-focused
application shell. The landing page communicates the product as an on-chain
spending-control layer for AI agents; the application exposes vault balances,
mandates, payment status, delivery status, and verifiable receipts.

- UI specification: [docs/UI_DESIGN_SPEC.md](docs/UI_DESIGN_SPEC.md)
- Product blueprint: [docs/PRD_BLUEPRINT.md](docs/PRD_BLUEPRINT.md)
- Implementation evidence: [docs/PROGRESS.md](docs/PROGRESS.md)

The public demo runs on BNB Smart Chain Testnet and uses mUSD demo tokens with no
monetary value. The contracts are not audited.
```

Tambahkan screenshot aktual setelah visual regression. Jangan memakai screenshot referensi sebagai hasil implementasi.

## 16. Prompt untuk frontend coding agent

```text
Implement the MandatePay frontend using docs/PRD_BLUEPRINT.md and
docs/UI_DESIGN_SPEC.md. Read both files completely before changing code.

Adapt the supplied dark cinematic reference to MandatePay. Do not copy its
product copy, brand mark, fake partner logos, or single-file index.html
architecture. Use the repository's Next.js App Router.

Build two distinct experiences:
1. `/`: full-bleed cinematic landing page, restrained white/silver typography,
   truthful technology labels, Launch App/View Architecture actions, mobile
   menu, reduced-motion fallback, and scrollable explanatory sections.
2. `/app`: functional UI for vault, agents, mandates, runs, payments, and
   activity. Do not place financial data over video.

Use the exact MandatePay copy and route intent in UI_DESIGN_SPEC. Keep BSC
Testnet/demo-token/not-audited labels visible. Treat payment confirmation and
service delivery as separate states. Never confirm from a frontend timer.

Do not use JavaScript number for token arithmetic. Parse API amount strings to
bigint and format with validated decimals. Preserve wrong-network, pending,
unknown, reverted, reorged, delivery-failed, empty, and loading states.

The supplied video URL is a prototype reference only. Do not publish or copy it
into the repo until its license and rights are documented. Provide a poster and
graceful fallback. Do not invent partner/security/performance claims.

Implement accessible keyboard/focus behavior, safe-area handling, responsive
layouts, prefers-reduced-motion, and deterministic visual tests. Use existing
shared DTO/status definitions rather than inventing a second schema.

Update docs/PROGRESS.md with files changed, commands/results, screenshots,
limitations, and next action. Do not claim implemented until production build,
E2E, visual regression, and manual video review have evidence.
```

## 17. Implementation order

1. Inspect dependencies, shared schemas, routes, and current app state.
2. Add tokens, fonts, accessibility primitives, marketing/application layouts.
3. Implement landing using poster fallback first.
4. Add video progressively and test contrast across frames.
5. Implement mobile menu, focus, safe area, reduced motion.
6. Build application shell and testnet/wallet states.
7. Implement mandate builder, run timeline, payment status, proof drawer against real DTOs.
8. Add component, E2E, accessibility, and visual regression tests.
9. Run production build and responsive/manual QA.
10. Add actual screenshot and README section only after implementation exists.

Frontend selesai hanya ketika landing page dan application flow sama-sama berfungsi.
