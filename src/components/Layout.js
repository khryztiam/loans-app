// components/Layout.js
import { AppBar, Toolbar, Typography, Box, Paper, Button } from '@mui/material';

export default function Layout({ children, sidebar, user, handleLogout }) {
  return (
    <Box   
    sx={{
        height: '100vh',        // Altura deseada (puede ser en vh, px, %, etc.)
        overflowY: 'auto'      // Habilita scroll vertical
      }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">Sistema de Préstamos</Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Bienvenido, {user.email}</Typography>
              <Button color="inherit" onClick={handleLogout}>Cerrar sesión</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Sección horizontal arriba */}
      <Box sx={{ p: 2 }}>
        <Paper sx={{ 
            p: 2, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            alignItems: 'center',
            justifyContent: 'space-between',
            }}>
          {sidebar}
        </Paper>
      </Box>

      {/* Contenido principal */}
      <Box sx={{
          p: 2,
          flexGrow: 1, // Esto hace que el contenedor principal ocupe el espacio restante
          //overflowY: 'auto', // Habilitar scroll vertical
        }}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden', // Evitar scroll horizontal
            maxHeight: 'calc(100vh - 64px - 16px)', // Altura máxima considerando la AppBar y el padding
             }}>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
