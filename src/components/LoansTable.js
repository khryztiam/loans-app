import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, CircularProgress
} from '@mui/material';
import { supabase } from '../lib/supabase';
import LoanRegisterModal from './LoanRegisterModal';

export default function LoansTable() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const fetchLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loans')
      .select(
        `id, nombre_recibe, serie, created_at, users(puesto, descripcion)`
      )
      .is('received_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando préstamos:', error.message);
    } else {
      setLoans(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();

    const channel = supabase
      .channel('realtime-loans')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loans' },
        (payload) => {
          console.log('Cambio en loans:', payload);
          fetchLoans(); // Refresca los préstamos cada vez que cambia algo
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Limpiar al desmontar
    };
  }, []);

  const calculateDaysDiff = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);
    const diffTime = now - createdDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRowClick = (loan) => {
    setSelectedLoan(loan);
    setModalOpen(true);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Historial de Préstamos
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
           <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>#</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Usuario</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Serial</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Puesto</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Departamento</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Fecha de Préstamo</TableCell>
                <TableCell sx={{ backgroundColor: '#424242', color: '#fff' }}>Días Transcurridos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map((loan, index) => (
                <TableRow
                  key={loan.id}
                  onClick={() => handleRowClick(loan)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f5f5f5', // Puedes usar un color suave de fondo
                    },
                  }}
                >
                  <TableCell>{loans.length - index}</TableCell> {/* ← Contador */}
                  <TableCell>{loan.nombre_recibe}</TableCell>
                  <TableCell>{loan.serie}</TableCell>
                  <TableCell>{loan.users?.puesto}</TableCell>
                  <TableCell>{loan.users?.descripcion}</TableCell>
                  <TableCell>{new Date(loan.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{calculateDaysDiff(loan.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <LoanRegisterModal
        open={modalOpen}
        handleClose={() => {
          setModalOpen(false);
          setSelectedLoan(null);
        }}
        mode="recepcion"
        selectedLoan={selectedLoan}
      />
    </>
  );
}
