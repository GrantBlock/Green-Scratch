import { Page, mount } from './common.tsx';
const DS = window.BlockConcepts;

function Home() {
  return (
    <Page>
      <DS.FixLayout
        buttons={<DS.ButtonColumn label="Concepts Hub tools" items={[{ id: 'contact', label: 'Contact' }, { id: 'library', label: 'Library' }]} onChange={(id) => { location.href = `/${id}`; }} />}
      >
        <section aria-labelledby="hub-title" className="hub-intro">
          <h1 id="hub-title">Concepts Hub</h1>
          <p>Tools from Block Concepts. Send us a note about a problem on your line, or browse the documents we have published.</p>
          <DS.Button variant="primary" href="/contact">Contact us</DS.Button>
        </section>
      </DS.FixLayout>
    </Page>
  );
}
mount(<Home />);
