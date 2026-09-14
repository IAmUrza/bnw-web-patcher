// Bootstrap first, global.css second: whichever loads last wins ties,
// and global.css needs to override Bootstrap's white body background.
import 'bootstrap/dist/css/bootstrap.css';
import '@/global.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
