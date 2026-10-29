import { useEffect, useMemo, useState } from 'react';
import type { PublicLibraryEntry } from '@bc/contract';
import { getJson, Page, mount } from './common.tsx';
const DS = window.BlockConcepts;

function Library() {
  const [entries, setEntries] = useState<PublicLibraryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState('');
  const [item, setItem] = useState('');
  const [entryId, setEntryId] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getJson<{ entries: PublicLibraryEntry[] }>('/hub/api/library').then((r) => {
      if (!r.ok) { setFailed(true); return; }
      setEntries(r.body.entries);
      const first = r.body.entries[0];
      if (first) { setTab(first.tab); setItem(first.item); }
    }).catch(() => setFailed(true));
  }, []);

  const tabs = useMemo(() => [...new Set((entries ?? []).map((e) => e.tab))].map((t) => ({ id: t, label: t })), [entries]);
  const items = useMemo(() => [...new Set((entries ?? []).filter((e) => e.tab === tab).map((e) => e.item))].map((i) => ({ id: i, label: i })), [entries, tab]);
  const list = useMemo(() => (entries ?? []).filter((e) => e.tab === tab && e.item === item).map((e) => ({ id: e.id, label: e.title })), [entries, tab, item]);
  const entry = (entries ?? []).find((e) => e.id === entryId);

  if (failed) return <Page current="library"><DS.StateMessage kind="error" title="The Library did not load" action={<DS.Button variant="secondary" onClick={() => location.reload()}>Try again</DS.Button>}>Check your connection and try again.</DS.StateMessage></Page>;
  if (!entries) return <Page current="library"><DS.StateMessage kind="loading" title="Loading the Library" /></Page>;
  if (entries.length === 0) return <Page current="library"><DS.StateMessage kind="empty" title="No documents yet">Documents we publish will appear here.</DS.StateMessage></Page>;

  return (
    <Page current="library">
      <h1 className="hub-title">Library</h1>
      <DS.GrabLayout
        tabs={tabs}
        tab={tab}
        onTab={(t) => { setTab(t); const first = entries.find((e) => e.tab === t); setItem(first?.item ?? ''); setEntryId(''); setOpen(false); }}
        columnA={<DS.ListBox label="Topics" items={items} value={item} onChange={(i) => { setItem(i); setEntryId(''); setOpen(false); }} />}
        columnB={<DS.ListBox label="Documents" search searchLabel="Search documents" items={list} value={entryId} onChange={(id) => { setEntryId(id); setOpen(true); }} />}
        detailOpen={open}
        onBack={() => setOpen(false)}
        expanded={expanded}
        detail={entry
          ? <DS.DetailPane title={entry.title} description={entry.description} whenToUse={entry.whenToUse} downloadHref={entry.downloadPath} downloadLabel="Download PDF" expanded={expanded} onToggleExpand={setExpanded} />
          : <DS.DetailPane empty emptyTitle="Nothing selected" emptyText="Choose a document to see what it covers and when to use it." />}
      />
      {/* Outside the layout: its panes have their own height, and anything added inside can run into the footer. */}
      {entry && open ? <p className="hub-after"><DS.Button variant="secondary" href={`/contact?tool=Library&entry=${encodeURIComponent(entry.title)}`}>Ask about this document</DS.Button></p> : null}
    </Page>
  );
}
mount(<Library />);
