import { useState } from 'react';
import { Page, mount } from './common.tsx';
const DS = window.BlockConcepts;

const MAX_FILE = 5 * 1024 * 1024;

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

function Contact() {
  const params = new URLSearchParams(location.search);
  const sourceTool = params.get('tool') ?? undefined;
  const entryTitle = params.get('entry') ?? undefined;
  const [v, setV] = useState({ name: '', company: '', email: '', phone: '', message: '', website: '' });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const set = (k: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [k]: value }));

  async function submit() {
    if (state === 'sending') return;
    setErrors({});
    setState('sending');
    try {
      const body: Record<string, unknown> = { name: v.name, company: v.company || undefined, email: v.email, phone: v.phone || undefined, message: v.message, website: v.website };
      if (sourceTool) body.sourceContext = { tool: sourceTool, entryTitle };
      if (file) body.attachment = { fileName: file.name, mimeType: file.type || undefined, contentBase64: await toBase64(file) };
      const r = await fetch('/hub/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { setState('sent'); return; }
      const j = (await r.json().catch(() => ({}))) as { error?: { fields?: Record<string, string> } };
      setErrors(j.error?.fields ?? {});
      setState('failed');
    } catch {
      setState('failed');
    }
  }

  if (state === 'sent') {
    return (
      <Page current="contact">
        <section aria-live="polite" className="hub-narrow">
          <DS.StateMessage kind="empty" title="We received your message">
            Thank you. We read every message and will reply to {v.email}.
          </DS.StateMessage>
          <DS.Button variant="secondary" href="/">Back to the Hub</DS.Button>
        </section>
      </Page>
    );
  }

  return (
    <Page current="contact">
      <section aria-labelledby="contact-title" className="hub-narrow">
        <h1 id="contact-title">Contact</h1>
        <p>Tell us what you are trying to fix or build. Only your email is required to reach you.</p>
        {entryTitle ? <p className="hub-context">About: {entryTitle}</p> : null}
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
          <DS.TextField label="Name" name="name" value={v.name} onChange={set('name')} optional error={errors.name} />
          <DS.TextField label="Company" name="company" value={v.company} onChange={set('company')} optional />
          <DS.TextField label="Email" name="email" type="email" value={v.email} onChange={set('email')} required error={errors.email} />
          <DS.TextField label="Phone" name="phone" value={v.phone} onChange={set('phone')} optional inputMode="tel" />
          <DS.TextArea label="What do you need?" name="message" rows={6} value={v.message} onChange={set('message')} hint="For example the parts, the rate, and what is not working today." error={errors.message} />
          <DS.FileDrop label="Attach a file" accept=".pdf,.png,.jpg,.jpeg,.dxf,.dwg,.step,.stp" optional fileName={file?.name} hint="A drawing or spec sheet. Up to 5 MB." error={fileError}
            onFiles={(list) => {
              const f = list[0];
              if (f && f.size > MAX_FILE) { setFile(null); setFileError('That file is larger than 5 MB. Send a smaller one, or tell us and we will arrange another way.'); return; }
              setFileError(''); setFile(f ?? null);
            }} />
          {/* Honeypot: people never see or fill this; automated form fillers do. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website')(e.target.value)} /></label>
          </div>
          {state === 'failed' ? <DS.Toast tone="error">We could not send your message. Check the form and try again.</DS.Toast> : null}
          <DS.Button variant="primary" disabled={state === 'sending'} onClick={() => void submit()}>{state === 'sending' ? 'Sending' : 'Send message'}</DS.Button>
        </form>
      </section>
    </Page>
  );
}
mount(<Contact />);
