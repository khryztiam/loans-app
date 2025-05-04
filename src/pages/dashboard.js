// pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import LoanAgingSummary from '@/components/LoanAgingSummary';
import UserUploader from '@/components/UserUploader';
import { Box, Button, Typography, Paper } from '@mui/material';

export default function Dashboard() {
  const [loansData, setLoansData] = useState([]);

  // Función para obtener los datos de los préstamos
  const fetchLoans = async () => {
    const { data, error } = await supabase.from('loans').select('*');
    if (!error) {
      setLoansData(data);
    } else {
      console.error('Error al obtener préstamos:', error);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <Layout user={null} handleLogout={() => {}} sidebar={null}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 2 }}>
        <Typography variant="h5">Dashboard de Reportes</Typography>
        
        {/* Botón para generar un reporte */}
        <Button variant="contained" onClick={() => {}} sx={{ maxWidth: '200px' }}>
          Nuevo Reporte
        </Button>

        {/* Resumen de préstamos */}
        <Paper sx={{ padding: 2, backgroundColor: '#f4f4f4' }}>
          <LoanAgingSummary loans={loansData} />
        </Paper>

        {/* Componente para cargar usuarios */}
        <UserUploader />
      </Box>
    </Layout>
  );
}
