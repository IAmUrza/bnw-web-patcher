import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

type NavLink = {
  href: string;
  label: string;
  external?: boolean;
};

const navLinks: NavLink[] = [
  { href: '/', label: 'Beta Web Patcher' },
  { href: '/guides', label: 'Documentation' },
  { href: 'https://ngplus.net/mods/brave-new-world/', label: 'Website', external: true },
  { href: 'https://discord.com/invite/bsuKp5A', label: 'Discord', external: true }
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  // No <html> or <body> here — those belong in pages/_document.tsx.
  return (
    <>
      <Head>
        <title>FF6: Brave New World Web Patcher</title>
        <meta
          name="description"
          content="Patch your FF6 ROM in browser."
        />

        <meta property="og:site_name" content="FF6: BNW Web Patcher" />
        <meta property="og:title" content="FF6: Brave New World" />
        <meta
          property="og:description"
          content="Patch your ROM in browser."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ff6bnw.vercel.app/" />
        <meta property="og:image" content="https://ff6bnw.vercel.app/og.png" />
        <meta property="og:image:width" content="192" />
        <meta property="og:image:height" content="96" />
        <meta property="og:image:alt" content="FF6: Brave New World" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#7b2d8e" />
      </Head>

      <nav className="top-nav">
        {navLinks.map(({ href, label, external }) =>
          external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <Link
              key={href}
              href={href}
              className={router.pathname === href ? 'active' : undefined}
            >
              {label}
            </Link>
          )
        )}
      </nav>

      <main>{children}</main>
    </>
  );
};

export default Layout;
