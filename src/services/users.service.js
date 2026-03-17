import { supabase } from '@/lib/supabase';

// Obtener todos los usuarioss
const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Buscar usuario por SAPID
const fetchUserBySapid = async (sapid) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('sapid', sapid)
    .single();

  if (error) throw error;
  return data;
};

// Crear o actualizar usuarios (bulk UPSERT)
const upsertUsers = async (users) => {
  const { count, error } = await supabase
    .from('users')
    .upsert(users, { onConflict: ['sapid'] });

  if (error) throw error;
  return count;
};

// Buscar usuarios por texto
const searchUsers = async (searchTerm) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`nombre.ilike.%${searchTerm}%,sapid.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
};

export default {
  fetchAllUsers,
  fetchUserBySapid,
  upsertUsers,
  searchUsers,
};
