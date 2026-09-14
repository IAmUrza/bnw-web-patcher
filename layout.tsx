import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

type NavLink = {
  href: string;
  label: string;
  external?: boolean;
};

const navLinks: NavLink[] = [
  { href: '/', label: 'Web Patcher' },
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
        <title>FF6 BNW Web Patcher</title>
        <meta name="description" content="Get FF6 BNW" />
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
