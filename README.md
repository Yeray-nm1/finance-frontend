# Finance Frontend

Dashboard de finanzas personales construido con Next.js 15, React 19, TypeScript y Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, primitivas de Radix UI
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4 con design tokens y variantes por componente
- **Gráficos**: Recharts
- **Utilidades**: Lucide React (iconos), date-fns, PapaParse (CSV)
- **Auth**: JWT en cookie `httpOnly` + React Context con rutas protegidas
- **Testing**: Vitest + Testing Library

## Prerrequisitos

- Node.js 20+ (el CI usa Node 24)
- pnpm 10

## Puesta en marcha

### Instalación

```bash
git clone <repository-url>
cd finance-frontend
pnpm install
```

### Configuración de la API

El frontend llama a `/api/v1/*` y Next.js lo redirige al backend en `http://localhost:3000` mediante un rewrite configurado en `next.config.ts`. Para apuntar a otro backend, cambia ese destino.

### Desarrollo

```bash
pnpm dev
```

La app se levanta en `http://localhost:3001`.

## Scripts

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor de desarrollo en el puerto 3001 |
| `build` | Build de producción |
| `start` | Servidor de producción |
| `lint` | Comprobaciones de ESLint |
| `test` | Ejecuta los tests con Vitest |
| `test:watch` | Tests en modo watch |

## Estructura del proyecto

```
src/
├── app/                      # Páginas y layouts del App Router
│   ├── login/                # Inicio de sesión
│   ├── register/             # Registro
│   ├── dashboard/            # Balance, presupuestos y movimientos recientes
│   ├── transactions/         # Tabla de transacciones con filtros y edición inline
│   ├── budgets/              # Presupuestos mensuales y gestión de categorías
│   ├── subscriptions/        # Suscripciones y autodetección
│   └── preferences/          # Preferencias del usuario
├── components/
│   ├── layout/               # Sidebar y layout raíz
│   ├── ui/                   # Primitivas Radix y variantes de estilos
│   └── *.tsx                 # Componentes compartidos (Card, diálogos, estados...)
├── contexts/                 # AuthContext y SidebarContext
├── hooks/                    # useAuth, useBudget, use-toast
├── lib/                      # Cliente API, navegación, formato y utilidades
├── types/                    # Tipos por dominio
└── middleware.ts             # Protección de rutas
```

## Features

- 🔐 Autenticación con cookie `httpOnly` y rutas protegidas
- 📊 Dashboard con balance del mes, desglose por tipo y movimientos recientes
- 💸 Transacciones con filtros por fecha/categoría/cuenta, ordenación, paginación y edición inline
- 📉 Presupuestos mensuales por categoría y tipo, con navegación entre meses y vista de solo lectura
- 🏷️ Gestión de categorías integrada en presupuestos
- 🔄 Suscripciones: alta manual, autodetección desde transacciones y vinculación de movimientos
- 📥 Importación de transacciones desde CSV
- 🎨 Design system propio con tokens de color y variantes reutilizables

## Tests

```bash
pnpm test
```
