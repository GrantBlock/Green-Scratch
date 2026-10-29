import { useEffect, useState } from 'react';
import type { SharePage } from '@bc/contract';
import { formatBytes, formatDate, prettyFolder, mount } from './common.tsx';
const DS = window.BlockConcepts;

const MAX_UPLOAD = 25 * 1024 * 1024;
type Problem = 'expired' | 'revoked' | 'not_found' | 'failed';
const PROBLEMS: Record<Problem, { title: string; text: string }> = {
  expired: { title: 'This link has expired', text: 'Ask Block Concepts for a new link.' },
  revoked: { title: 'This link is no longer active', text: 'Ask Block Concepts for a new link.' },
  not_found: { title: 'We could not find this page', text: 'Check the link you were sent, or ask Block Concepts to send it again.' },
  failed: { title: 'The page did not load', text: 'Check your connection and try again.' },
};

function UploadSlot({ token, slot, onDone }: { token: string; slot: SharePage['uploadSlots'][number]; onDone: (name: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!file || busy) return;
    setBusy(true); setError('');
    try {
      const r = await fetch(`/hub/p/${encodeURIComponent(token)}/uploads/${encodeURIComponent(slot.checklistItemId)}`, { method: 'POST', headers: { 'x-file-name': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' }, body: file });
      if (r.ok) { onDone(file.name); return; }
      const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
      setError(j.error?.message ?? 'We could not receive that file. Try again.');
    } catch { setError('We could not send that file. Check your connection and try again.'); }
    setBusy(false);
  }
  return (
    <div className="hub-slot">
      <DS.FileDrop label={`Send: ${slot.name}`} fileName={file?.name} error={error} hint="Up to 25 MB."
        onFiles={(l) => { const f = l[0]; if (f && f.size > MAX_UPLOAD) { setFile(null); setError('That file is larger than 25 MB.'); return; } setError(''); setFile(f ?? null); }} />
      <DS.Button variant="primary" disabled={!file || busy} onClick={() => void send()}>{busy ? 'Sending' : 'Send file'}</DS.Button>
    </div>
  );
}

function Customer() {
  const token = decodeURIComponent(location.pathname.split('/')[2] ?? '');
  const [page, setPage] = useState<SharePage | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const load = () => fetch(`/hub/p/${encodeURIComponent(token)}`, { headers: { accept: 'application/json' } }).then(async (r) => {
    if (r.ok) { setPage((await r.json()) as SharePage); return; }
    const j = (await r.json().catch(() => ({}))) as { error?: { code?: string } };
    setProblem((['expired', 'revoked', 'not_found'].includes(j.error?.code ?? '') ? j.error!.code : 'failed') as Problem);
  }).catch(() => setProblem('failed'));
  useEffect(() => { void load(); }, []);

  // A link page has no navigation to anything else: just the wordmark and what the link allows.
  const frame = (body: React.ReactNode) => (
    <main id="main" className="hub-main hub-customer">
      <header><DS.Wordmark variant="dark" size={15} mark /></header>
      {body}
    </main>
  );

  if (problem) return frame(<DS.StateMessage kind="error" title={PROBLEMS[problem].title}>{PROBLEMS[problem].text}</DS.StateMessage>);
  if (!page) return frame(<DS.StateMessage kind="loading" title="Loading" />);

  return frame(
    <>
      <h1>{page.projectName}</h1>
      <p className="hub-expiry">This link works until {formatDate(page.expiresAt)}.</p>
      {sent.map((n) => <DS.Toast key={n} tone="success" onClose={() => setSent((s) => s.filter((x) => x !== n))}>We received {n}.</DS.Toast>)}
      {page.uploadSlots.length > 0 ? (
        <section aria-labelledby="send-title">
          <h2 id="send-title">Files we asked for</h2>
          {page.uploadSlots.map((s) => <UploadSlot key={s.checklistItemId} token={token} slot={s} onDone={(name) => { setSent((x) => [...x, name]); void load(); }} />)}
        </section>
      ) : null}
      {page.folders.length > 0 ? (
        <section aria-labelledby="docs-title">
          <h2 id="docs-title">Documents</h2>
          {page.folders.map((f) => (
            <div key={`${f.folder}|${f.subfolder ?? ''}`} className="hub-folder">
              <h3>{prettyFolder(f.folder)}{f.subfolder ? `: ${f.subfolder}` : ''}</h3>
              <ul className="hub-docs">
                {f.documents.map((d) => (
                  <li key={d.id}>
                    <span className="hub-doc-title">{d.title}</span>
                    <span className="hub-doc-meta">{d.kind}, revision {d.revision}{d.sizeBytes ? `, ${formatBytes(d.sizeBytes)}` : ''}</span>
                    <DS.Button variant="secondary" href={d.downloadPath}>Download</DS.Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : page.uploadSlots.length === 0 ? <DS.StateMessage kind="empty" title="Nothing to show yet">Documents will appear here when Block Concepts releases them to you.</DS.StateMessage> : null}
    </>,
  );
}
mount(<Customer />);
