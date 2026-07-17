'use client';

/**
 * app/patient/[caseId]/page.tsx — VERSI TESTING, TANPA UI/STYLING
 *
 * Tujuan file ini cuma buat verifikasi end-to-end Alur 2 nyala apa nggak:
 *   GET /api/patient/educate?case_id=xxx  → tampilkan materi edukasi
 *   GET /api/patient/chat?case_id=xxx     → tampilkan histori chat
 *   POST /api/patient/chat                → kirim pertanyaan baru
 *
 * BUKAN untuk demo — nggak ada styling, semua state raw ditampilkan biar
 * gampang ketauan kalau ada yang error. Ganti total pas FE mulai kerjain
 * versi asli (PatientChat.tsx component, dll).
 *
 * CATATAN Next.js 15: `params` di App Router sekarang berbentuk Promise di
 * page.tsx — di-unwrap pakai React.use(), bukan diakses langsung sebagai
 * object biasa.
 */

import { use, useEffect, useState } from 'react';
import type { EdukasiPasien } from '@/types/patient';

interface ChatMessage {
  sender: 'pasien' | 'sistem';
  message: string;
  out_of_context: boolean | null;
  created_at: string;
}

interface ChatApiResponse {
  ai_status: 'success' | 'error';
  ai_error_code: string | null;
  jawaban: string | null;
  out_of_context: boolean | null;
}

interface EducateErrorResponse {
  ai_status: 'error';
  ai_error_code: string;
  data: null;
}

export default function PatientDebugPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);

  const [edukasi, setEdukasi] = useState<EdukasiPasien | null>(null);
  const [edukasiError, setEdukasiError] = useState<string | null>(null);
  const [loadingEdukasi, setLoadingEdukasi] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pertanyaan, setPertanyaan] = useState('');
  const [sending, setSending] = useState(false);

  async function loadEdukasi() {
    setLoadingEdukasi(true);
    setEdukasiError(null);
    try {
      const res = await fetch(`/api/patient/educate?case_id=${caseId}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as EdukasiPasien | EducateErrorResponse;
      if (!res.ok || data.ai_status === 'error') {
        setEdukasiError(
          `[${res.status}] ${'ai_error_code' in data ? data.ai_error_code : 'UNKNOWN'}`
        );
        setEdukasi(null);
        return;
      }
      setEdukasi(data as EdukasiPasien);
    } catch (err) {
      setEdukasiError('fetch gagal total: ' + String(err));
    } finally {
      setLoadingEdukasi(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/patient/chat?case_id=${caseId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      console.error('[debug] loadHistory gagal:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadEdukasi();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function sendMessage() {
    const q = pertanyaan.trim();
    if (!q || sending) return;

    setSending(true);
    setPertanyaan('');
    setMessages((prev) => [
      ...prev,
      { sender: 'pasien', message: q, out_of_context: null, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch('/api/patient/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, pertanyaan: q }),
      });
      const data = (await res.json()) as ChatApiResponse;

      const replyText =
        data.ai_status === 'success' && data.jawaban
          ? data.jawaban
          : `[ERROR ${data.ai_error_code ?? 'UNKNOWN'}] status HTTP ${res.status}`;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'sistem',
          message: replyText,
          out_of_context: data.out_of_context,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'sistem',
          message: '[fetch gagal total] ' + String(err),
          out_of_context: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 16 }}>[DEBUG] Patient Page</h1>
      <p>
        case_id: <code>{caseId}</code>
      </p>

      <hr style={{ margin: '16px 0' }} />

      <section style={{ border: '1px solid #999', padding: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14 }}>
          Edukasi <button onClick={loadEdukasi}>[reload]</button>
        </h2>

        {loadingEdukasi && <p>loading...</p>}

        {edukasiError && (
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{edukasiError}</pre>
        )}

        {edukasi && !edukasiError && (
          <div>
            <p>
              ai_status: <b>{edukasi.ai_status}</b>
              {edukasi.ai_error_code && ` (${edukasi.ai_error_code})`}
            </p>
            <p>
              <b>Penyebab:</b> {edukasi.penyebab || '(kosong)'}
            </p>
            <p>
              <b>Bagaimana terjadi:</b> {edukasi.bagaimana_terjadi || '(kosong)'}
            </p>
            <p>
              <b>Pencegahan/perawatan:</b> {edukasi.pencegahan_perawatan || '(kosong)'}
            </p>
            <p>
              <b>Bukti ({edukasi.bukti.length}):</b>
            </p>
            <ul>
              {edukasi.bukti.map((b) => (
                <li key={b.id}>
                  [{b.id}] {b.title} ({b.year ?? '?'}) — score {b.relevance_score} —{' '}
                  {b.doi ?? 'no-doi'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #999', padding: 12 }}>
        <h2 style={{ fontSize: 14 }}>
          Chat <button onClick={loadHistory}>[reload history]</button>
        </h2>

        {loadingHistory && <p>loading history...</p>}

        <div
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            margin: '8px 0',
            border: '1px solid #ccc',
            padding: 8,
            background: '#fafafa',
          }}
        >
          {messages.length === 0 && <p>(belum ada pesan)</p>}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <b>[{m.sender}]</b> {m.message}
              {m.out_of_context && <i style={{ color: 'orange' }}> (out_of_context)</i>}
            </div>
          ))}
        </div>

        <input
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Tulis pertanyaan pasien di sini..."
          style={{ width: '70%', padding: 4 }}
          disabled={sending}
        />{' '}
        <button onClick={sendMessage} disabled={sending}>
          {sending ? 'Mengirim...' : 'Kirim'}
        </button>
      </section>
    </div>
  );
}