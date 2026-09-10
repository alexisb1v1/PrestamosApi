# Documentación de API - PrestamosApi (Refactorizado)

Esta documentación resume los endpoints disponibles en el backend de **PrestamosApi** después de la refactorización a **Arquitectura Limpia** y **DDD**. Todos los endpoints (excepto los públicos) requieren un **Bearer Token** en el encabezado de autorización.

## Información General
- **Base URL:** `http://localhost:3000` (o la URL de tu servidor)
- **Prefijo Global:** `/api/v1`
- **Autenticación:** JWT (Bearer Token)
- **Semántica de Rutas:** Todos los recursos utilizan nombres en **singular** y parámetros descriptivos.

---

## Formato de Error Estándar (Sistema ERROR_CODES)
Todas las respuestas de error siguen esta estructura dinámica basada en el diccionario centralizado:

```json
{
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED",
  "message": "No autorizado",
  "timestamp": "2026-04-01T18:15:15.737Z"
}
```

| errorCode | Mensaje Predeterminado | HTTP Status | Ámbito |
| :--- | :--- | :--- | :--- |
| `GEN_001` | Error inesperado del servidor | 500 | General |
| `GEN_002` | Los datos ingresados son inválidos | 400 | General |
| `GEN_003` | No autorizado | 401 | General |
| `GEN_004` | No tiene permisos para realizar esta acción | 403 | General |
| `GEN_005` | El recurso solicitado no fue encontrado | 404 | General |
| `USR_001` | El usuario no existe | 404 | Usuarios |
| `USR_002` | La ficha personal no existe | 404 | Usuarios |
| `USR_003` | El nombre de usuario ya está en uso | 400 | Usuarios |
| `USR_004` | La persona ya está registrada con ese documento | 400 | Usuarios |
| `LOA_001` | El préstamo solicitado no existe | 404 | Préstamos |
| `LOA_002` | La persona ya tiene un préstamo activo en curso | 400 | Préstamos |
| `LOA_003` | El plazo solicitado no cumple con el mínimo requerido | 400 | Préstamos |
| `LOA_004` | El préstamo no puede aceptar pagos en la fecha actual | 400 | Préstamos |
| `LOA_005` | La cuota o pago no fue encontrado | 404 | Préstamos |
| `COM_001` | La empresa solicitada no existe | 404 | Empresas |
| `COM_002` | La empresa se encuentra inactiva o bloqueada | 403 | Empresas |
| `EXP_001` | El gasto solicitado no existe | 404 | Gastos |

---

## 1. Módulo de Autenticación (`/auth`)

### Login
- **Path:** `POST /api/v1/auth/login`
- **Acceso:** Público
- **Request Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "mySecurePassword",
    "fingerprint": "optional-device-id"
  }
  ```
- **Response Success (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbG...",
    "user": {
      "id": "1",
      "username": "admin",
      "profile": "ADMIN",
      "status": "ACTIVE",
      "isDayClosed": false,
      "idCompany": "1",
      "companyStatus": "ACTIVE",
      "person": {
        "id": "10",
        "documentType": "DNI",
        "documentNumber": "12345678",
        "firstName": "Alexis",
        "lastName": "V"
      }
    }
  }
  ```

---

## 2. Módulo de Usuario (`/user`)

### Listar Usuarios
- **Path:** `GET /api/v1/user`
- **Parámetros (URL Query):** `username`?, `idCompany`?
- **Response Success (200):** `UserResponseDto[]`

### Crear Usuario (y Persona)
- **Path:** `POST /api/v1/user`
- **Request Body (JSON):**
  ```json
  {
    "username": "jdoe",
    "password": "securePassword123",
    "profile": "COLLECTOR",
    "documentType": "DNI",
    "documentNumber": "77889900",
    "firstName": "John",
    "lastName": "Doe",
    "birthday": "1992-05-15",
    "idCompany": "1"
  }
  ```
- **Response Success (201):** `{ "success": true, "userId": "123" }`

### Ver Usuario por ID
- **Path:** `GET /api/v1/user/:userId`
- **Response Success (200):** `{ "success": true, "user": {...}, "person": {...} }`

### Cambiar Estado de Cierre de Día
- **Path:** `PATCH /api/v1/user/:userId/toggle-day-status`
- **Request Body (JSON):** `{ "isDayClosed": true }`
- **Response Success (200):** `{ "success": true, "message": "Estado del día actualizado correctamente" }`

### Actualizar Orden de Cobro
- **Path:** `PATCH /api/v1/user/collection-order`
- **Request Body (JSON):** `{ "collectionOrder": [ "loan-id-1", "loan-id-2" ] }`

---

## 3. Módulo de Persona (`/person`)

### Buscar Persona por Documento
- **Path:** `GET /api/v1/person/search`
- **Parámetros (URL Query):** `documentType`, `documentNumber`
- **Example:** `GET /api/v1/person/search?documentType=DNI&documentNumber=12345678`

### Crear Persona
- **Path:** `POST /api/v1/person`
- **Descripción:** Registra una persona física en el sistema. La **Persona** es la entidad base que almacena los datos de identidad. Una vez creada, su `id` debe ser usado para vincularla a otras entidades como:
  - **Préstamo:** (Se envía el `idPeople` al crear un préstamo).
  - **Usuario:** (Se asocia al crear una cuenta de acceso al sistema).
- **Request Body (JSON):**
  ```json
  {
    "documentType": "DNI",
    "documentNumber": "77889900",
    "firstName": "Juan",
    "lastName": "Pérez",
    "birthday": "1990-05-15"
  }
  ```
- **Response Success (201):**
  ```json
  {
    "id": "123"
  }
  ```


---

## 4. Módulo de Préstamo (`/loan`)

### Listar Préstamos
- **Path:** `GET /api/v1/loan`
- **Parámetros (URL Query):** `userId`?, `searchQuery`?, `companyId`?, `isLiquidated` (bool)
- **Response Success (200):** `LoanResponseDto[]`

### Crear Nuevo Préstamo
- **Path:** `POST /api/v1/loan`
- **Request Body (JSON):**
  ```json
  {
    "idPeople": "10",
    "amount": 1000.50,
    "userId": "1",
    "address": "Av. Principal 456, Lima",
    "phone": "999888777",
    "days": 24
  }
  ```

### Ver Detalle y Abonos
- **Path:** `GET /api/v1/loan/:loanId/details`

### Reasignar Cobrador
- **Path:** `PATCH /api/v1/loan/:loanId/reassign`
- **Request Body (JSON):** `{ "newUserId": "2" }`

### Eliminar Préstamo (Lógico)
- **Path:** `DELETE /api/v1/loan/:loanId`
- **Acceso:** ADMIN o OWNER

---

## 5. Módulo de Cuota (`/installment`)

### Registrar Abono (Pago)
- **Path:** `POST /api/v1/installment`
- **Request Body (JSON):**
  ```json
  {
    "loanId": "500",
    "amount": 50.0,
    "userId": "1",
    "paymentType": "CASH" 
  }
  ```

### Eliminar Abono
- **Path:** `DELETE /api/v1/installment/:installmentId`

---

## 6. Módulo de Gasto (`/expense`)

### Listar Gastos
- **Path:** `GET /api/v1/expense`
- **Parámetros (URL Query):** `userId`?, `date`?

### Registrar Nuevo Gasto
- **Path:** `POST /api/v1/expense`
- **Request Body (JSON):** `{ "description": "Gasto x", "amount": 10.0, "userId": "1" }`

---

## 7. Módulo de Dashboard

### Obtener Estadísticas Diarias
- **Path:** `GET /api/v1/dashboard`
- **Parámetros (URL Query):** `userId`?, `companyId`?

---

## 8. Módulo de Empresa (`/company`)

### Listar Empresas
- **Path:** `GET /api/v1/company`

### Crear Empresa
- **Path:** `POST /api/v1/company`
- **Request Body (JSON):** `{ "companyName": "Mi Empresa" }`

---

## 9. Reportes (`/report`)

### Reporte de Préstamos y Cobranza
- **Path:** `GET /api/v1/report/loan`
- **Parámetros (URL Query):** `startDate`, `endDate`, `companyId`?, `userId`?

---

> [!IMPORTANT]
> - Todos los **IDs** deben ser tratados como **strings**.
> - Las fechas deben enviarse en formato **ISO 8601** (`YYYY-MM-DD`).
