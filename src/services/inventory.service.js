import { supabase } from '@/lib/supabase';

// Obtener estado general del inventario basado en la columna in_loan
export const getInventoryStatus = async () => {
  try {
    // Obtener TODOS los dispositivos con su estado in_loan
    const { data: allDevices, error: devicesError } = await supabase
      .from('tags_devices')
      .select('idtag, in_loan');

    if (devicesError) {
      console.warn('Error fetching inventory:', devicesError);
      return {
        available: 0,
        total: 0,
      };
    }

    // Contar dispositivos totales y disponibles
    let totalCount = 0;
    let availableCount = 0;

    (allDevices || []).forEach((device) => {
      totalCount += 1;
      
      // Si in_loan es false, está disponible
      if (device.in_loan === false) {
        availableCount += 1;
      }
    });

    return {
      available: availableCount,
      total: totalCount,
    };
  } catch (err) {
    console.error('Error in getInventoryStatus:', err);
    return {
      available: 0,
      total: 0,
    };
  }
};

// Cambiar estado de un dispositivo por ID
export const updateDeviceStatus = async (deviceId, inLoan) => {
  try {
    const { error } = await supabase
      .from('tags_devices')
      .update({ 
        in_loan: inLoan
      })
      .eq('idtag', deviceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating device status:', err);
    return false;
  }
};

// Buscar dispositivo por idtag (serie del equipo) y actualizar in_loan
export const findAndUpdateDeviceByServiceTag = async (deviceSerie, inLoan) => {
  try {
    // Buscar el dispositivo por idtag (serie del equipo)
    const { data: devices, error: searchError } = await supabase
      .from('tags_devices')
      .select('idtag, service_tag, in_loan')
      .eq('idtag', deviceSerie.toUpperCase())
      .limit(1);

    if (searchError) throw searchError;
    if (!devices || devices.length === 0) {
      console.warn(`Device with idtag ${deviceSerie} not found`);
      return null;
    }

    const device = devices[0];

    // Actualizar su estado (solo in_loan)
    const { error: updateError } = await supabase
      .from('tags_devices')
      .update({ 
        in_loan: inLoan
      })
      .eq('idtag', device.idtag);

    if (updateError) throw updateError;
    return device;
  } catch (err) {
    console.error('Error in findAndUpdateDeviceByServiceTag:', err);
    return null;
  }
};
