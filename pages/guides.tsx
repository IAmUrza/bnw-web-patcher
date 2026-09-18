import { NextPage } from 'next';
import Layout from '@/layout';

const downloads = [
  { href: '/downloads/readme.txt', label: 'readme.txt' },
  { href: '/downloads/printme.pdf', label: 'printme.pdf' },
  { href: '/downloads/PDFme.pdf', label: 'PDFme.pdf' },
  { href: '/downloads/char_planner.ods', label: 'char_planner.ods' },
  { href: '/downloads/unlockme.rar', label: 'unlockme.rar', note: 'Beat BNW to Unlock' },
];

const links = [
  { href: 'https://bnw.pages.dev/', label: 'Online Searchable Printme' },
  { href: 'https://ngplus.net/', label: 'NGPlus' },
  { href: 'https://www.ff6hacking.com/', label: 'FF6Hacking' },
];

const characterGuides = [
  { name: 'Terra', href: 'http://ngplus.net/index.php?/forums/topic/146-terra-branford-the-power-of-love/' },
  { name: 'Celes', href: 'http://ngplus.net/index.php?/forums/topic/151-celes-chere-dog-of-the-empire/' },
  { name: 'Locke', href: 'http://ngplus.net/index.php?/forums/topic/147-locke-cole-treasure-hunter/' },
  { name: 'Edgar', href: 'http://ngplus.net/index.php?/forums/topic/149-edgar-roni-figaro-hail-to-the-king-baby/' },
  { name: 'Sabin', href: 'http://ngplus.net/index.php?/forums/topic/150-sabin-rene-figaro-well-dont-that-just-beat-all/' },
  { name: 'Cyan', href: 'http://ngplus.net/index.php?/forums/topic/148-cyan-garamonde-retainer-to-the-king-of-doma/' },
  { name: 'Shadow', href: 'http://ngplus.net/index.php?/forums/topic/152-shadow-real-ultimate-power/' },
  { name: 'Gau', href: 'http://ngplus.net/index.php?/forums/topic/160-gau-rage-against-the-magitek/' },
  { name: 'Setzer', href: 'http://ngplus.net/index.php?/forums/topic/153-setzer-gabbiani-the-angel-the-gambler/' },
  { name: 'Mog', href: 'http://ngplus.net/index.php?/forums/topic/154-mog-mascot-with-attitude-kupo/' },
  { name: 'Strago', href: 'http://ngplus.net/index.php?/forums/topic/155-strago-magus-get-off-my-lawn/' },
  { name: 'Relm', href: 'http://ngplus.net/index.php?/forums/topic/156-relm-arrowny-age-is-just-a-number/' },
  { name: 'Umaro', href: 'http://ngplus.net/index.php?/forums/topic/157-umaro-hulk-smash/' },
  { name: 'Gogo', href: 'http://ngplus.net/index.php?/forums/topic/158-gogo-slave-to-the-power-of-death/' },
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

        <section className='docs-section'>
          <h2 className='docs-heading'><span>Character Guides</span></h2>
          <ul className='docs-list docs-guide-grid'>
            {characterGuides.map(g => (
              <li key={g.name}>
                <a href={g.href} target='_blank' rel='noopener noreferrer'>{g.name}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default Guides;
