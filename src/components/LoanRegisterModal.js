// components/LoanRegisterModal.js
import {
    Modal, Box, Typography, TextField, Button, MenuItem, Select,
    InputLabel, FormControl
  } from '@mui/material';
  import { useEffect, useState } from 'react';
  import { supabase } from '../lib/supabase';
  
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

 
  export default function LoanRegisterModal({ open, handleClose, mode = 'entrega', selectedLoan = null, onSuccess }) {
    const [sapid, setSapid] = useState('');
    const [nombreRecibe, setNombreRecibe] = useState('');
    const [diasPrestamo, setDiasPrestamo] = useState('');
    const [tipoEquipo, setTipoEquipo] = useState('');
    const [tag, setTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userNotFound, setUserNotFound] = useState(false);
  
    const isEntrega = mode === 'entrega';
    const isRecepcion = mode === 'recepcion';
  
    // Reset form
    const resetForm = () => {
      setSapid('');
      setNombreRecibe('');
      setDiasPrestamo('');
      setTipoEquipo('');
      setTag('');
      setError('');
      setUserNotFound(false);
    };
  
    useEffect(() => {
      const cleanedSapid = sapid.trim();

      if (!cleanedSapid) {
        setNombreRecibe('');
        setUserNotFound(false);
        return;
      }
  
      const fetchNombre = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('nombre')
          .eq('sapid', cleanedSapid)
          .single();
  
        if (data) {
          setNombreRecibe(data.nombre);
          setUserNotFound(false);
        } else {
          setNombreRecibe('Usuario no registrado');
          setUserNotFound(true);
        }
      };
  
      fetchNombre();
    }, [sapid]);
  
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        const cleanedSapid = sapid.trim();
      
        try {
          if (isEntrega) {
            const { error } = await supabase.from('loans').insert([
              {
                sapid_usuario: cleanedSapid,
                nombre_recibe: nombreRecibe || 'Usuario no registrado',
                dias_prestamo: parseInt(diasPrestamo),
                tipo_equipo: tipoEquipo,
                serie: tag,
              },
            ]);
      
            if (error) throw error; // Lanza el error para que lo capture el catch
            
            resetForm();
            if (onSuccess) onSuccess(); // Llama a onSuccess si existe
            handleClose();
          }
          else if (isRecepcion && selectedLoan) {
            const { error } = await supabase
              .from('loans')
              .update({
                received_at: new Date().toISOString(),
                sapid_recepcion: cleanedSapid,
                nombre_entrega: nombreRecibe || 'Usuario no registrado',
              })
              .eq('id', selectedLoan.id);
      
            if (error) throw error;
            
            resetForm();
            if (onSuccess) onSuccess(); // También para recepción
            handleClose();
          }
        } catch (error) {
          // Maneja errores tanto de entrega como recepción
          setError(isEntrega ? 'Error al registrar el préstamo' : 'Error al registrar la recepción');
          console.error('Error en el formulario:', error);
        } finally {
          setLoading(false); // Siempre se ejecuta, haya o no error
        }
      };
  
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            {isEntrega ? 'Registrar nuevo préstamo' : 'Registrar recepción de equipo'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <TextField
                label="SAP ID"
                fullWidth
                value={sapid}
                onChange={(e) => setSapid(e.target.value.trim())}
                required
              />
              <TextField
                label="Usuario"
                fullWidth
                margin="normal"
                value={nombreRecibe}
                disabled
                error={userNotFound}
                helperText={userNotFound ? 'Usuario no registrado en la base de datos' : ''}
              />
            </FormControl>
  
            {isEntrega && (
              <>
                <TextField
                  label="Días de préstamo"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={diasPrestamo}
                  onChange={(e) => setDiasPrestamo(e.target.value)}
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tipo-equipo-label">Tipo de equipo</InputLabel>
                  <Select
                    labelId="tipo-equipo-label"
                    value={tipoEquipo}
                    label="Tipo de equipo"
                    onChange={(e) => setTipoEquipo(e.target.value)}
                    required
                  >
                    <MenuItem value="Laptop">Laptop</MenuItem>
                    <MenuItem value="Tablet">Tablet</MenuItem>
                    <MenuItem value="Escáner">Escáner</MenuItem>
                    <MenuItem value="Impresora">Impresora</MenuItem>
                    <MenuItem value="Otro">Extension</MenuItem>
                    <MenuItem value="Otro">UPS</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Serie de equipo"
                  fullWidth
                  margin="normal"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  required
                />
              </>
            )}
  
            {isRecepcion && selectedLoan && (
              <>
                <Typography variant="body2" mt={2}>
                  <strong>TAG / Serie Equipo:</strong> {selectedLoan.serie}
                </Typography>
                <Typography variant="body2" mt={1}>
                  <strong>Préstamo registrado:</strong> {new Date(selectedLoan.created_at).toLocaleString()}
                </Typography>
              </>
            )}
  
            {error && <Typography color="error" mt={1}>{error}</Typography>}
  
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : isEntrega
                ? 'Registrar préstamo'
                : 'Registrar recepción'}
            </Button>
          </form>
        </Box>
      </Modal>
    );
  }
  