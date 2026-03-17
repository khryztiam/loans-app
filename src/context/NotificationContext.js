'use client';

import { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const success = useCallback((message, duration = 3000) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const error = useCallback((message, duration = 5000) => {
    return addNotification(message, 'error', duration);
  }, [addNotification]);

  const warning = useCallback((message, duration = 4000) => {
    return addNotification(message, 'warning', duration);
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, success, error, warning }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
