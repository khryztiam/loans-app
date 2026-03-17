# Guía de Instalación y Configuración - Gestión de Activos IT v2.0

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=tu-anon-key
```

### 3. Ejecutar
```bash
npm run dev
# http://localhost:3000
```

---

## 📋 Estructura del Proyecto

```
src/
├── components/ui/          # Componentes primitivos (Button, Input, etc)
├── components/layout/      # Layout y navegación
├── context/                # Estado global (Auth, Notifications)
├── hooks/                  # Custom hooks reutilizables
├── services/               # Lógica de negocio (Supabase queries)
├── lib/                    # Utilidades y constantes
├── pages/                  # Rutas de la aplicación
└── styles/                 # CSS con Tailwind
```

---

## 🔑 Variables de Entorno Necesarias

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_KEY` | Clave pública anon de Supabase |

Obtener en: Dashboard Supabase → Settings → API

---

## 🗄️ Tablas Supabase Requeridas

### users
```
sapid (texto, primary key)
nombre (texto)
descripcion (texto)
grupo (texto)
puesto (texto)
supervisor (texto)
```

### loans
```
id (número, primary key)
sapid (texto)
nombre_recibe (texto)
tipo_equipo (texto)
serie (texto)
created_at (timestamp)
received_at (timestamp, nullable)
dias_prestamo (número)
sapid_recepcion (texto, nullable)
```

### asignaciones_permanentes
```
id (número, primary key)
sapid (texto)
modelo (texto)
serie (texto)
accesorios (JSON)
localidad (texto)
fecha_asignacion (fecha)
detalles (texto)
```

---

## 🎯 Flujo Actual

1. **Login** (`/`) - Email + Contraseña
2. **Dashboard** (`/dashboard`) - Métricas principales
3. **Préstamos** (`/prestamos`) - Registrar y gestionar préstamos
4. **Asignaciones** (`/asignaciones`) - CRUD de asignaciones
5. **Usuarios** (`/usuarios`) - Importar desde Excel

---

## 🔄 Arquitectura de Datos

### AuthContext
Maneja:
- Sesión del usuario
- Login/Logout
- Estado de autenticación

### NotificationContext
Proporciona:
- Mensajes success/error
- Notificaciones con auto-cierre
- Sistema global de alertas

### Services
`loans.service.js`, `users.service.js`, `assignments.service.js`
Encapsulan toda lógica Supabase

### Custom Hooks
- `useAuth()` - Acceso a autenticación
- `useFetch()` - Data fetching genérico
- `useForm()` - Manejo de formularios
- `useNotification()` - Notificaciones

---

## 📝 Completar la Aplicación

### Prioridad ALTA
- [ ] Instalar Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Generar config: `npx tailwindcss init -p`
- [ ] Importar fonts en globals.css
- [ ] Probar login funcional

### Prioridad MEDIA
- [ ] Componentices tabla de préstamos (filtros, búsqueda)
- [ ] Validación form mejorada
- [ ] Exportación PDF
- [ ] Gráficos en dashboard (Chart.js)

### Prioridad BAJA
- [ ] Dark mode
- [ ] Atajos de teclado
- [ ] Historial de cambios
- [ ] Email notifications

---

## 🧪 Testing Local

1. Crear usuario test en Supabase Auth
2. Crear registros test en tablas
3. Probar login y flujos principales

---

## 💨 Comandos Útiles

```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run lint     # Linter
npm start        # Prod server
```

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| undefined variables | Verificar .env.local |
| usuario no autenticado | Login primero en / |
| tabla no existe | Verificar nombres en Supabase |
| estilos no aplican | Limpiar .next y reiniciar |

---

## 📞 Soporte

- Documentación Next.js: https://nextjs.org/docs
- Documentación Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com

---

**Versión:** 2.0.0  
**Última actualización:** Marzo 2026