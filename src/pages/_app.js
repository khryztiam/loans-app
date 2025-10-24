// pages/_app.js
import { useRouter } from 'next/router';
import '@/styles/globals.css'; 
import '@/styles/layout.css';
import '@/styles/summary.css';
import '@/styles/loantable.css';
import '@/styles/loan-modal.css';
import '@/styles/userupload.css';
import '@/styles/assignment-form.css';
import '@/styles/responsive.css';
import '@/styles/dashboard.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div className="content">
      <Component {...pageProps} />
    </div>
  );
}
