import { supabase } from '@/lib/supabase';

// Obtener todas las asignaciones
export const fetchAllAssignments = async () => {
  const { data, error } = await supabase
    .from('asignaciones_permanentes')
    .select('*')
    .order('fecha_asignacion', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Obtener una asignación específica
export const fetchAssignmentById = async (id) => {
  const { data, error } = await supabase
    .from('asignaciones_permanentes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Crear nueva asignación
export const createAssignment = async (assignmentData) => {
  const { data, error } = await supabase
    .from('asignaciones_permanentes')
    .insert([assignmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Actualizar asignación
export const updateAssignment = async (id, assignmentData) => {
  const { data, error } = await supabase
    .from('asignaciones_permanentes')
    .update(assignmentData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Eliminar asignación
export const deleteAssignment = async (id) => {
  const { error } = await supabase
    .from('asignaciones_permanentes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Buscar asignaciones por filtros
export const searchAssignments = async (filters = {}) => {
  let query = supabase.from('asignaciones_permanentes').select('*');

  if (filters.sapid) {
    query = query.eq('sapid', filters.sapid);
  }

  if (filters.modelo) {
    query = query.eq('modelo', filters.modelo);
  }

  if (filters.localidad) {
    query = query.eq('localidad', filters.localidad);
  }

  const { data, error } = await query.order('fecha_asignacion', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Obtener modelos únicos (para filtros)
export const fetchUniqueModels = async () => {
  const { data, error } = await supabase
    .from('asignaciones_permanentes')
    .select('modelo')
    .order('modelo');

  if (error) throw error;
  
  const uniqueModels = [...new Set((data || []).map(item => item.modelo))]
    .filter(Boolean)
    .sort();
  
  return uniqueModels;
};
