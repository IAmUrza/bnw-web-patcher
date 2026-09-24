import { NextPage } from 'next';
import { useState } from 'react';
import Layout from '@/layout';

const downloads = [
  { href: '/downloads/readme.txt', label: 'readme.txt' },
  { href: '/downloads/printme.pdf', label: 'printme.pdf' },
  { href: '/downloads/PDFme.pdf', label: 'PDFme.pdf' },
  { href: '/downloads/char_planner.xlsm', label: 'char_planner.xlsm' },
  { href: '/downloads/unlockme.rar', label: 'unlockme.rar', note: 'Beat BNW to Unlock' },
];

const links = [
  { href: 'https://bnw.pages.dev/', label: 'Online Searchable Printme' },
  { href: 'https://ngplus.net/', label: 'NGPlus' },
  { href: 'https://www.ff6hacking.com/', label: 'FF6Hacking' },
];

const characterGuides = [
  { name: 'Terra', slug: 'TERRA' },
  { name: 'Celes', slug: 'CELES' },
  { name: 'Locke', slug: 'LOCKE' },
  { name: 'Edgar', slug: 'EDGAR' },
  { name: 'Sabin', slug: 'SABIN' },
  { name: 'Cyan', slug: 'CYAN' },
  { name: 'Shadow', slug: 'SHADOW' },
  { name: 'Gau', slug: 'GAU' },
  { name: 'Setzer', slug: 'SETZER' },
  { name: 'Mog', slug: 'MOG' },
  { name: 'Strago', slug: 'STRAGO' },
  { name: 'Relm', slug: 'RELM' },
  { name: 'Umaro', slug: 'UMARO' },
  { name: 'Gogo', slug: 'GOGO' },
];

const Guides: NextPage = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [guideText, setGuideText] = useState('');
  const [guideError, setGuideError] = useState(false);

  const handleCharacterClick = async (name: string, slug: string) => {
    setSelectedCharacter(name);
    setGuideError(false);
    try {
      const res = await fetch(`/guides/${slug}.txt`);
      if (!res.ok) throw new Error('failed');
      setGuideText(await res.text());
    } catch {
      setGuideError(true);
      setGuideText('');
    }
  };

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
              <li key={g.slug}>
                <button
                  type='button'
                  className={`docs-guide-btn${selectedCharacter === g.name ? ' docs-guide-btn-active' : ''}`}
                  onClick={() => handleCharacterClick(g.name, g.slug)}
                >
                  {g.name}
                </button>
              </li>
            ))}
          </ul>

{selectedCharacter && (
            <div className='character-guide-display'>
              <h3 className='docs-heading'><span>{selectedCharacter}</span></h3>
			  {guideError && <p className='docs-note'>Couldn&apos;t load this guide.</p>}
			  {!guideError && (
		  		<pre className='character-guide-text'>{guideText}</pre>
			  )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Guides;