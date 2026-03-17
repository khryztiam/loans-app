'use client';

import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { useNotification } from '@/hooks/useNotification';

function NotificationDisplay() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`alert alert-${notification.type} animate-slide-in`}
        >
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-lg leading-none hover:opacity-50"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
        <NotificationDisplay />
      </NotificationProvider>
    </AuthProvider>
  );
}
