import { NextPage } from 'next';
import Layout from '@/layout';

const downloads = [
  { href: '/downloads/readme.txt', label: 'readme.txt' },
  { href: '/downloads/printme.pdf', label: 'printme.pdf' },
  { href: '/downloads/PDFme.pdf', label: 'PDFme.pdf' },
  { href: '/downloads/unlockme.rar', label: 'unlockme.rar', note: 'Beat BNW to Unlock' },
];

const links = [
  { href: 'https://bnw.pages.dev/', label: 'Online Searchable Printme' },
  { href: 'https://ngplus.net/', label: 'NGPlus' },
  { href: 'https://www.ff6hacking.com/', label: 'FF6Hacking' },
];

const Guides: NextPage = () => {

  return (
    <Layout>
      <div className='guides-bg'>
        <p className='app-title'>
          Final Fantasy VI: Brave New World
          <span className='app-subtitle'>Documentation</span>
        </p>

        <p className='docs-bug-note'>
          Found a bug? Report it on our{' '}
            <a
            href='https://discord.com/invite/bsuKp5A'
            target='_blank'
            rel='noopener noreferrer'
          >
            Discord server
          </a>!
        </p>

        <section className='docs-section'>
          <h2 className='docs-heading'><span>Downloads</span></h2>
          <ul className='docs-list'>
            {downloads.map(d => (
              <li key={d.href}>
                <a href={d.href} download>{d.label}</a>
                {d.note && <span className='locked-note docs-inline-note'> — {d.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className='docs-section'>
          <h2 className='docs-heading'><span>Links</span></h2>
          <ul className='docs-list'>
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href} target='_blank' rel='noopener noreferrer'>{l.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default Guides;