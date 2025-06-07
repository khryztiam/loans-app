// pages/_app.js
import { useRouter } from 'next/router';
import '@/styles/globals.css'; // Importa tus estilos globales aquí
import '@/styles/layout.css'
import '@/styles/summary.css'
import '@/styles/loantable.css'
import '@/styles/loan-modal.css'


export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div className="content">
      <Component {...pageProps} />
    </div>
  );
}
