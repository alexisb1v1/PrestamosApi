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

### Caché y Arquitectura de Redis
- **Redis** con `ioredis` — para sesiones, Kill-Switch de seguridad, aceleración de autenticación y autorización perimetral de subdominios.
- **Estrategia Estricta de Namespaces y Convivencia Inter-Proyecto:**
  Redis actúa como una infraestructura compartida entre varios sistemas del ecosistema (`PrestamosApi`, `VecturaApi`, `verifyDomain`, `Caddy`). Por ello, se definen dos zonas de claves con propósitos y reglas inmutables:

  1. **Namespace Compartido Perimetral (`tenant:<domain>`):**
     - **Formato:** `tenant:<subdominio>.<dominioBase>` (ejemplo: `tenant:mypes.neocobros.com`).
     - **Valor:** `"1"` (activo) o no existe (inactivo/revocado).
     - **TTL:** Persistente (sin expiración).
     - **Consumidores:** Reverse-proxy **Caddy** (TLS On-Demand) y el microservicio Go [`verifyDomain`](file:///d:/Personal/Repositorios/verifyDomain/README.md).
     - **Regla de Oro:** **NUNCA RENOMBRAR NI PREFIJAR.** Este formato de clave es un contrato transversal inter-proyecto compartido entre **NeoCobros** (`neocobros.com`) y **NeoRuta / Vectura** (`neoruta.com`). Modificarlo rompe la emisión de certificados SSL y el acceso perimetral de todo el ecosistema.
     - **Gestión:** `PrestamosApi` escribe o elimina esta clave únicamente al crear, reactivar, renombrar o dar de baja un subdominio de empresa.

  2. **Namespace Privado de NeoCobros (`neocobros:tenant:auth:<companyId>`):**
     - **Formato jerárquico:** `neocobros:tenant:auth:<companyId>` (organizado en carpetas lógicas para herramientas como RedisInsight).
     - **Valor:** JSON serializado con el estado de la empresa (`id`, `keyToken`, `status`, `features`).
     - **TTL:** 10 minutos (600 segundos).
     - **Consumidores:** Exclusivo de `PrestamosApi` ([`JwtAuthGuard`](file:///d:/Personal/Repositorios/PrestamosApi/src/users/infrastructure/security/jwt-auth.guard.ts)).
     - **Mecanismo Kill-Switch:** Al modificar el estado de la empresa, suspenderla o actualizar su configuración en PostgreSQL, los handlers de comando ejecutan inmediatamente `redis.del('neocobros:tenant:auth:' + companyId)`. Al milisegundo siguiente, todas las peticiones activas de cobradores y administradores de esa empresa son revocadas con 401 Unauthorized sin tocar otras empresas ni afectar el proxy.

### Autenticación
- **JWT** con `@nestjs/jwt`
- Payload incluye: `sub`, `username`, `profile`, `personId`, `fgp` (fingerprint de dispositivo hasheado con SHA-256)
- Contraseñas hasheadas con `bcrypt`

### Seguridad
- **Helmet** — headers HTTP seguros
- **Throttler** — rate limiting por IP
- **CORS** configurado por entorno
- **Criptografía de Enlaces Públicos** — Cifrado autenticado **AES-256-GCM** para tokens opacos temporales con expiración (`loanId:expiresAt`) y resolución de subdominio multi-tenant en memoria vía cabeceras HTTP (`X-Tenant-Subdomain`, `Origin`, `Referer`), garantizando 0 impacto a PostgreSQL.

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

### Reverse Proxy y SSL (Caddy + verifyDomain)
- **Caddy Proxy:** Reverse proxy de borde con separación de dos esquemas de dominios:
  - **Registro Estático Fijo (`central.neocobros.com`):** Configurado con bloque de servidor fijo en el `Caddyfile`. **NO usa On-Demand TLS ni microservicio**. Es exclusivo del portal administrativo (`OWNER`, `id_company = 0`).
  - **Subdominios Dinámicos de Tenants (`*.neocobros.com`):** Configurado con `on_demand_tls` delegado al microservicio transversal Go `verifyDomain`.
- **Microservicio `verifyDomain` (Go):** Intercepta la consulta de Caddy por `subdominio.dominio`:
  1. Consulta en Redis por la clave persistente `tenant:<subdominio>.<dominio>`.
  2. Si existe (`"1"`): Responde `200 OK` en $< 1 \text{ ms}$.
  3. Si no existe (Cache Miss): Ejecuta fallback de auto-curación hacia `PrestamosApi` (`GET /api/v1/company/verify-domain?domain=...`).
  4. `PrestamosApi` consulta en PostgreSQL (`company`). Si está activa, repuebla Redis con `"1"` y autoriza a Caddy.
- **Aislamiento de `central`:** `PrestamosApi` no procesa consultas de verificación para `central`, ya que `central` no es una empresa cliente en la base de datos.

### Multi-tenant
- Cada empresa cliente accede por su propio subdominio: `https://<empresa>.neocobros.com`
- El backend resuelve el tenant desde el subdominio en cada request
- El login verifica credenciales cruzadas con la empresa del subdominio
- El usuario `OWNER` ingresa por `https://central.neocobros.com` con `id_company = 0` (o `NULL`), sin atarse a ningún tenant cliente.

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
