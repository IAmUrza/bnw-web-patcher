// pages/_document.tsx
// Next.js renders <html> and <body> here, once, for the whole app.
// No other component should render those tags.
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Local file from public/img/. The ?v= is cache-busting: browsers
            hold on to favicons hard, so bump the number after each change. */}
        <link rel="icon" type="image/png" href="/img/favicon.png?v=2" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
