# onehealth-mcp-relay

MCP server dengan satu tool (`ask_backend`) yang jadi jembatan antara **Hermes Agent**
(jalur WhatsApp, PRDv2 §11) dan endpoint backend `POST /api/webhook/whatsapp`.

**Prinsip yang dijaga ketat (PRDv2 §11.2):** Hermes di jalur WhatsApp TIDAK BOLEH menjawab
pasien pakai reasoning-nya sendiri. Dia WAJIB dikunci supaya cuma boleh manggil tool `ask_backend`,
dan menyampaikan hasilnya verbatim. Semua guardrail (anti-halu-sitasi, anti-prompt-injection)
ada di backend webapp — MCP server ini sengaja "bodoh", cuma HTTP relay.

(Catatan: dicek lewat dokumentasi resmi Hermes — tidak ada mode native "forward pesan mentah
ke webhook eksternal". Semua pesan tetap lewat agent/LLM Hermes, jadi "pipa bukan otak" di sini
ditegakkan lewat tool-lock + instruksi platform, bukan bypass di level transport.)

## Setup di VPS

```bash
cd ~/OneHealth.AI/gateway/mcp-server   # sesuaikan path clone repo kamu
npm install
cp .env.example .env
# isi ONEHEALTH_BACKEND_URL (https://one-health-ai-pearl.vercel.app) dan
# HERMES_WEBHOOK_SECRET (sama persis dengan env Vercel) di .env
```

## Daftarin ke Hermes

Cek dulu flag yang tersedia di CLI kamu (versi bisa beda-beda):

```bash
hermes mcp add -h
```

Syntax umum per dokumentasi resmi: `hermes mcp add <name> [--url URL] [--command CMD] [--args ...]`
(`--args` diisi paling akhir, dia nampung sisa argv buat command stdio-nya). Kemungkinan besar:

```bash
hermes mcp add onehealth-mcp-relay --command node --args ~/OneHealth.AI/gateway/mcp-server/index.js
```

Sesuaikan `<name>` dan path kalau flag aslinya beda dari yang di atas.

## Kunci toolset Hermes di jalur WhatsApp (WAJIB, jangan skip)

Begitu WhatsApp sudah di-pairing (`hermes whatsapp`), platform baru bernama `whatsapp`
akan muncul di `hermes tools --summary` dengan toolset default yang SAMA LUASNYA kayak CLI
(termasuk Terminal & Code Execution — bahaya kalau kebawa ke jalur pasien). Matikan semua,
nyalain cuma tool ini:

```bash
hermes tools disable <semua-toolset-default> --platform whatsapp   # lihat `hermes tools list`
hermes tools enable onehealth-mcp-relay:ask_backend --platform whatsapp
```

Verifikasi akhir — pastikan cuma 1 tool yang aktif di jalur WhatsApp:

```bash
hermes tools --summary
```

## Paksa agent selalu manggil tool ini (WAJIB, jangan skip)

Tool-lock di atas cuma membatasi tool APA yang BOLEH dipanggil — tidak
memaksa Hermes untuk benar-benar memanggilnya (dicek lewat dokumentasi
resmi: tidak ada mode native "forward mentah ke webhook eksternal", Hermes
selalu memutuskan lewat LLM-nya sendiri). Supaya perilakunya benar,
copy `AGENTS.md.example` di folder ini jadi `AGENTS.md` di direktori tempat
kamu menjalankan `hermes` di VPS:

```bash
cp AGENTS.md.example ~/AGENTS.md   # atau path lain tempat kamu jalanin `hermes`
```

Isinya instruksi tegas: setiap pesan WhatsApp masuk WAJIB lewat tool
`ask_backend`, dan balasannya WAJIB disampaikan verbatim, tanpa reasoning
sendiri.

## Jalanin sebagai service (biar nggak mati pas VPS restart)

```bash
pm2 start index.js --name onehealth-mcp-relay
pm2 save
```
