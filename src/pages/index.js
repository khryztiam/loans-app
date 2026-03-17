import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Button, Input, Alert } from '@/components/ui';
import { RootLayout } from '@/components/layout/RootLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Error al iniciar sesión');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error inesperado. Intente nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full max-w-md card-lg">
          <h1 className="text-3xl font-bold text-center mb-6 text-blue-900">
            Gestión de Activos IT
          </h1>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-4">
            Sistema interno de Gestión de Préstamos de Equipos IT
          </p>
        </div>
      </div>
    </RootLayout>
  );
}