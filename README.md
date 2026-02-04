# MAQUINARIA PRO - Sistema de Control de Maquinaria Pesada

Sistema integral de gestión, control y documentación de flota de maquinaria pesada para el Grupo Vásquez.

## Características Principales

- **Dashboard Interactivo**: Estadísticas en tiempo real, gráficos y alertas críticas
- **Gestión de Maquinaria**: CRUD completo con búsqueda avanzada y exportación a Excel
- **Control de Mantenimientos**: Seguimiento preventivo (250H, 500H, 1000H) y correctivo
- **Documentos Técnicos**: Control de SOAT y revisiones CITV con alertas de vencimiento
- **Control de Combustible**: Registro de entradas y salidas de combustible
- **Valorizaciones**: Gestión de valorizaciones de activos
- **Reportes PDF**: Generación de reportes exportables
- **Sistema de Alertas**: Notificaciones por email con Resend
- **Auditoría**: Historial completo de cambios con registro de usuario
- **Gestión de Usuarios**: Sistema RBAC con 4 roles (admin, supervisor, operador, visualizador)

## Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Gráficos**: Chart.js con react-chartjs-2
- **Iconos**: Lucide React
- **Excel I/O**: XLSX
- **Email**: Resend API
- **Despliegue**: Vercel

## Requisitos Previos

- Node.js 18+
- Cuenta en Supabase
- (Opcional) Cuenta en Resend para alertas por email

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/maquinaria-pro.git
cd maquinaria-pro
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
RESEND_API_KEY=tu_resend_api_key
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run lint     # Ejecutar linter
```

## Estructura del Proyecto

```
src/
├── app/                    # Rutas y páginas (App Router)
│   ├── api/               # API Routes
│   ├── admin/             # Páginas de administración
│   ├── maquinaria/        # Gestión de maquinaria
│   ├── mantenimientos/    # Control de mantenimientos
│   ├── soat/              # Control de SOAT
│   ├── citv/              # Revisiones técnicas
│   └── ...
├── components/            # Componentes React reutilizables
│   ├── auth-provider.tsx  # Context de autenticación
│   ├── app-shell.tsx      # Layout principal
│   ├── toast-provider.tsx # Sistema de notificaciones
│   └── ...
└── lib/                   # Utilidades y configuración
    ├── api.ts             # Funciones HTTP
    ├── supabase.ts        # Cliente de Supabase
    ├── permisos.ts        # Sistema RBAC
    └── types.ts           # Tipos TypeScript
```

## Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| **Admin** | Acceso total, gestión de usuarios |
| **Supervisor** | Lectura y edición en mayoría de secciones |
| **Operador** | Lectura de datos y edición limitada |
| **Visualizador** | Solo lectura de reportes |

## Despliegue en Vercel

1. Conectar repositorio con Vercel
2. Configurar variables de entorno
3. Desplegar

## Licencia

Proyecto privado - Grupo Vásquez © 2026
