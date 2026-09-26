# NeoCobros - Stack Técnico

## Proyectos del Sistema

| Proyecto | Rol | Repositorio |
|---|---|---|
| `Prestamos` | Frontend PWA | `d:/Personal/Repositorios/Prestamos` |
| `PrestamosApi` | Backend API REST | `d:/Personal/Repositorios/PrestamosApi` |
| `webNeocobros` | Landing page | `d:/Personal/Repositorios/webNeocobros` |
| `verifyDomain` | Micro-API transversal de validación de subdominios | `d:/Personal/Repositorios/verifyDomain` |

> `verifyDomain` es un servicio compartido (transversal) usado también por otros sistemas como NeoRuta.

---

## Backend — `PrestamosApi`

### Framework y Lenguaje
- **NestJS 11** con **TypeScript 5.7**
- **Arquitectura:** Clean Architecture en 4 capas (`domain`, `application`, `infrastructure`, `interfaces`)
- **Patrón:** CQRS con `@nestjs/cqrs` — separación estricta de Commands y Queries
- **DDD:** Dominio modelado con entidades, repositorios e interfaces bien definidas
- **Manejo de errores:** Funcional con `neverthrow` (patrón `Result<T, AppError>`)

### Base de Datos
- **PostgreSQL** con **TypeORM 0.3**
- Multi-tenant via subdominio (cada empresa tiene su propio `idCompany`)

### Caché
- **Redis** con `ioredis` — para sesiones, caché de configuración y tokens

### Autenticación
- **JWT** con `@nestjs/jwt`
- Payload incluye: `sub`, `username`, `profile`, `personId`, `fgp` (fingerprint de dispositivo hasheado con SHA-256)
- Contraseñas hasheadas con `bcrypt`

### Seguridad
- **Helmet** — headers HTTP seguros
- **Throttler** — rate limiting por IP
- **CORS** configurado por entorno

### Documentación
- **Swagger UI** con `@nestjs/swagger`

### Testing
- **Jest** + **Supertest** para tests unitarios e integración
- Compilación rápida con **SWC**

### Módulos del sistema

| Módulo | Responsabilidad |
|---|---|
| `users` | Autenticación, gestión de cobradores y admins |
| `companies` | Multi-tenant, empresas y configuración |
| `loans` | Préstamos, cuotas y pagos |
| `expenses` | Gastos operativos de cobradores |
| `reports` | Agregación de datos para reportes y KPIs |
| `health` | Health check endpoint (`/health`) |
| `common/database` | Configuración de TypeORM/PostgreSQL |
| `common/redis` | Configuración de Redis |

---

## Frontend — `Prestamos`

### Framework y Lenguaje
- **Next.js 16.1** con **React 19** — App Router
- **TypeScript** estricto
- **PWA** habilitada con `@ducanh2912/next-pwa`

### Estilos
- **CSS Modules** — estilos encapsulados por componente/módulo
- Sin frameworks CSS externos (sin Tailwind, sin Bootstrap)
- Sistema de diseño propio con variables CSS
- Responsive design: mobile-first con media queries

### UI / Componentes
- **lucide-react** — iconografía
- **@dnd-kit** — drag and drop (reordenamiento de rutas)
- **driver.js** — tours guiados de onboarding
- **html2canvas** — captura/exportación de pantallas
- **neverthrow** — manejo funcional de errores en capa de features

### Estructura de rutas (App Router)

```
app/
├── (dashboard)/
│   ├── cobradores/       # Gestión de cobradores
│   ├── configuracion/    # Configuración del sistema
│   ├── dashboard/        # Resumen principal
│   ├── empresas/         # Gestión de empresas (admin central)
│   ├── gastos/           # Registro de gastos operativos
│   ├── prestamos/        # Gestión de préstamos y pagos
│   └── reportes/
│       ├── vision-general/   # KPIs consolidados
│       ├── por-cobrador/     # Reporte por cobrador
│       └── por-cliente/      # Salud crediticia por cliente
├── compartir/            # Vista pública de fichas de préstamo
├── login/                # Autenticación
├── payment-required/     # Pantalla de suscripción vencida
└── system-closed/        # Pantalla de sistema cerrado
```

### Arquitectura Frontend (por módulo)
```
features/
└── <modulo>/
    ├── models/       # Interfaces TypeScript del dominio
    ├── dto/          # DTOs de request/response
    ├── repositories/ # Llamadas a la API (fetch/axios)
    └── use-cases/    # Lógica de negocio del cliente
```

---

## Infraestructura

### Despliegue
- **Docker** — ambos proyectos contenerizados con `Dockerfile`
- Variables de entorno por archivo `.env`

### Reverse Proxy y SSL
- **Caddy** — reverse proxy principal
- **On-Demand TLS** — certificados SSL automáticos por subdominio
- **`verifyDomain`** (Go) — micro-API que valida los subdominios antes de emitir el certificado

### Multi-tenant
- Cada empresa accede por su propio subdominio: `empresa.neocobros.com`
- El backend resuelve el tenant desde el subdominio en cada request
- El login verifica credenciales cruzadas con la empresa del subdominio

---

## Convenciones y Estándares

### Backend
- Nomenclatura: `kebab-case` para archivos, `PascalCase` para clases
- Un handler por Command/Query
- Errores tipados: `'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL'`
- Nunca lanzar excepciones directas en handlers — siempre retornar `Result`

### Frontend
- CSS Modules con nombres en `camelCase`
- Sin estilos inline salvo valores dinámicos (ej. ancho de barra de progreso)
- Componentes de página en `page.tsx`, layouts en `layout.tsx`
- Media queries: `max-width: 768px` para mobile, `min-width: 1024px` para desktop wide
