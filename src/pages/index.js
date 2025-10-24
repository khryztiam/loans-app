import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import { TextField, Button, Typography, Container, Box } from '@mui/material'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Verificar si el usuario ya está autenticado al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard') // Si está autenticado, redirige a demo
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard') // Redirige si el login es exitoso
    }
    setLoading(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        backgroundImage: 'url(/background.png)', // pon tu ruta aquí
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
    <Container maxWidth="xs"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 4,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" gutterBottom align="center">
        Iniciar sesión
        </Typography>
      <form onSubmit={handleLogin}>
        <TextField
          label="Correo electronico"
          variant='outlined'
          fullWidth
          margin='normal'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label='Password'
          variant='outlined'
          fullWidth
          margin='normal'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant='contained'
          color='primary'
          fullWidth
          style={{marginTop:'1rem'}}
          disabled={loading}>
          {loading ? 'Cargando...' : 'Entrar'}
        </Button>
      </form>
      {error && <Typography color= 'error' align='center' style={{ marginTop: '1rem' }}>
        {error}
        </Typography>}
    </Container>
    </Box>
  )
}