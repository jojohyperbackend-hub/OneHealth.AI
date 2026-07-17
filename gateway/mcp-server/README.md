# onehealth-mcp-relay

MCP server dengan satu tool (`ask_backend`) yang jadi jembatan antara **Hermes Agent**
(jalur WhatsApp, PRDv2 §11) dan endpoint backend `POST /api/patient/chat` (punya FS).

**Prinsip yang dijaga ketat (PRDv2 §11.2):** Hermes di jalur WhatsApp TIDAK BOLEH menjawab
pasien pakai reasoning-nya sendiri. Dia WAJIB dikunci supaya cuma boleh manggil tool `ask_backend`,
dan menyampaikan hasilnya verbatim. Semua guardrail (anti-halu-sitasi, anti-prompt-injection)
ada di backend webapp — MCP server ini sengaja "bodoh", cuma HTTP relay.

## Setup di VPS

```bash
cd ~/OneHealth.AI/gateway/mcp-server   # sesuaikan path clone repo kamu
npm install
cp .env.example .env
# isi ONEHEALTH_BACKEND_URL di .env dengan URL webapp Next.js kita
```

## Daftarin ke Hermes

```bash
hermes mcp add
# pilih "local command", arahkan ke: node ~/OneHealth.AI/gateway/mcp-server/index.js
```

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

## Jalanin sebagai service (biar nggak mati pas VPS restart)

```bash
pm2 start index.js --name onehealth-mcp-relay
pm2 save
```
