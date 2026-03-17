import { supabase } from '@/lib/supabase';

// Obtener todos los préstamos activos
export const fetchActiveLoans = async () => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .is('received_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching active loans:', error);
    throw error;
  }
  
  return data || [];
};

// Obtener un préstamo específico
export const fetchLoanById = async (id) => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Registrar nuevo préstamo
export const createLoan = async (loanData) => {
  const { data, error } = await supabase
    .from('loans')
    .insert([loanData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Marcar préstamo como recibido
export const receiveLoan = async (loanId, sapidRecepcion) => {
  const { data, error } = await supabase
    .from('loans')
    .update({ 
      received_at: new Date().toISOString(),
      sapid_recepcion: sapidRecepcion
    })
    .eq('id', loanId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Obtener estadísticas de préstamos
export const fetchLoanMetrics = async () => {
  const today = new Date();

  // Préstamos activos
  const { count: activeCount } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .is('received_at', null);

  // Préstamos vencidos
  const { data: activeLoans } = await supabase
    .from('loans')
    .select('created_at, dias_prestamo')
    .is('received_at', null);

  let overdueCount = 0;
  if (activeLoans) {
    activeLoans.forEach((loan) => {
      const deadline = new Date(loan.created_at);
      deadline.setDate(deadline.getDate() + loan.dias_prestamo);
      if (today > deadline) overdueCount++;
    });
  }

  // Préstamos esta semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  const { count: weeklyCount } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  return {
    activeLoans: activeCount || 0,
    overdueLoans: overdueCount,
    weeklyLoans: weeklyCount || 0,
  };
};

// Buscar préstamos por filtros
export const searchLoans = async (filters = {}) => {
  let query = supabase.from('loans').select('*').is('received_at', null);

  if (filters.nombre_recibe) {
    query = query.ilike('nombre_recibe', `%${filters.nombre_recibe}%`);
  }

  if (filters.tipo_equipo) {
    query = query.eq('tipo_equipo', filters.tipo_equipo);
  }

  if (filters.serie) {
    query = query.ilike('serie', `%${filters.serie}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Buscar préstamos activos por nombre de usuario o serie de equipo (para RECEPCIÓN)
export const searchActiveLoans = async (query) => {
  if (!query || query.trim().length === 0) return [];

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .is('received_at', null)
    .or(
      `nombre_recibe.ilike.${searchTerm},serie.ilike.${searchTerm},tipo_equipo.ilike.${searchTerm}`
    )
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

// Obtener inventario disponible por tipo de equipo
export const fetchInventoryByType = async (tipoEquipo) => {
  const { data, error } = await supabase
    .from('tags_devices')
    .select('*')
    .eq('tipo_equipo', tipoEquipo)
    .eq('estado', 'disponible');

  if (error) throw error;
  return data || [];
};

// Obtener conteo de equipos disponibles por tipo
export const getAvailableEquipmentCount = async () => {
  const { data, error } = await supabase
    .from('tags_devices')
    .select('tipo_equipo')
    .eq('estado', 'disponible');

  if (error) throw error;

  const counts = {};
  (data || []).forEach((item) => {
    counts[item.tipo_equipo] = (counts[item.tipo_equipo] || 0) + 1;
  });

  return counts;
};

const loansService = {
  fetchActiveLoans,
  fetchLoanById,
  createLoan,
  receiveLoan,
  fetchLoanMetrics,
  searchLoans,
  searchActiveLoans,
};

export default loansService;
