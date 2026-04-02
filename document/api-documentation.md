# Documentación de API - PrestamosApi (Refactorizado)

Esta documentación resume los endpoints disponibles en el backend de **PrestamosApi** después de la refactorización a **Arquitectura Limpia** y **DDD**. Todos los endpoints (excepto los públicos) requieren un **Bearer Token** en el encabezado de autorización.

## Información General
- **Base URL:** `http://localhost:3000` (o la URL de tu servidor)
- **Prefijo Global:** `/api/v1` (la mayoría de los recursos)
- **Autenticación:** JWT (Bearer Token)

---

## Formato de Error Estándar
Todas las respuestas de error siguen esta estructura para facilitar el manejo en el frontend:

```json
{
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED",
  "message": "No autorizado",
  "timestamp": "2026-04-01T18:15:15.737Z"
}
```

| errorCode | Descripción | HTTP Status |
| :--- | :--- | :--- |
| `NOT_FOUND` | El recurso solicitado no existe | 404 |
| `ALREADY_EXISTS` | Conflicto: el recurso ya está registrado | 400 |
| `INVALID_INPUT` | Datos enviados no válidos o incompletos | 400 |
| `UNAUTHORIZED` | Credenciales inválidas o sesión expirada | 401 |
| `FORBIDDEN` | No tiene permisos suficientes (ej. empresa inactiva) | 403 |
| `UNEXPECTED_ERROR` | Error interno del servidor | 500 |

---

## 1. Módulo de Autenticación (`/auth`)

### Login
- **Path:** `POST /api/v1/auth/login`
- **Acceso:** Público
- **Request Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "mySecurePassword"
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

## 2. Módulo de Usuarios (`/users`)

### Listar Usuarios
- **Path:** `GET /api/v1/users`
- **Parámetros (URL Query):** `username`?, `idCompany`?
- **Ejemplo:** `GET /api/v1/users?idCompany=1`
- **Response Success (200):**
  ```json
  [
    {
       "id": "1",
       "username": "jdoe",
       "profile": "COLLECTOR",
       "status": "ACTIVE",
       "isDayClosed": false,
       "firstName": "John",
       "lastName": "Doe",
       "documentNumber": "77889900",
       "idCompany": "1"
    }
  ]
  ```

### Crear Usuario (y Persona)
- **Path:** `POST /api/v1/users`
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
- **Response Success (201):**
  ```json
  {
    "success": true,
    "message": "User and Person created successfully",
    "userId": "123"
  }
  ```

### Cambiar Estado de Cierre de Día (Cierre de Cobrador)
- **Path:** `PATCH /api/v1/users/:id/toggle-day-status`
- **Request Body (JSON):**
  ```json
  {
    "isDayClosed": true
  }
  ```
- **Response Success (200):** `{ "success": true, "message": "Estado del día actualizado correctamente" }`

---

## 3. Módulo de Personas (`/people`)

### Buscar Persona por Documento
- **Path:** `GET /api/v1/people/search`
- **Parámetros (URL Query):** `documentType`, `documentNumber`
- **Ejemplo:** `GET /api/v1/people/search?documentType=DNI&documentNumber=12345678`
- **Response Success (200):**
  ```json
  {
    "id": "10",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "firstName": "Maria",
    "lastName": "Garcia",
    "birthday": "1985-10-20"
  }
  ```

---

## 4. Módulo de Préstamos (`/loans`)

### Listar Préstamos
- **Path:** `GET /api/v1/loans`
- **Parámetros (URL Query):** `userId`?, `documentNumber`?, `companyId`?
- **Response Success (200):**
  ```json
  [
    {
      "id": "500",
      "amount": 1000,
      "interest": 200,
      "fee": 50,
      "days": 24,
      "status": "ACTIVE",
      "address": "Calle Falsa 123",
      "clientName": "John Doe",
      "collectorName": "Admin",
      "paidToday": 1,
      "remainingAmount": 450.50,
      "inIntervalPayment": 1,
      "userId": "1",
      "personId": "10"
    }
  ]
  ```

### Crear Nuevo Préstamo
- **Path:** `POST /api/v1/loans`
- **Request Body (JSON):**
  ```json
  {
    "idPeople": 10,
    "amount": 1000.50,
    "userId": 1,
    "address": "Av. Principal 456, Lima",
    "days": 24
  }
  ```
- **Response Success (201):** `{ "success": true, "loanId": "500" }`

### Ver Detalle y Abonos
- **Path:** `GET /api/v1/loans/:id/details`
- **Response Success (200):**
  ```json
  {
    "startDate": "2024-03-01T00:00:00Z",
    "endDate": "2024-03-25T00:00:00Z",
    "installments": [
      {
        "id": "1",
        "date": "2024-03-02T10:00:00Z",
        "amount": 50,
        "status": "ACTIVE",
        "registeredBy": "Admin",
        "registeredByUserId": "1"
      }
    ]
  }
  ```

### Eliminar Préstamo (Lógico)
- **Path:** `DELETE /api/v1/loans/:id`
- **Acceso:** ADMIN o OWNER
- **Response Success (200):** `{ "success": true, "message": "Préstamo eliminado" }`

### Registrar Abono (Pago)
- **Path:** `POST /api/v1/loans/installments`
- **Request Body (JSON):**
  ```json
  {
    "loanId": "500",
    "amount": 50.0,
    "userId": "1",
    "paymentType": "CASH" 
  }
  ```
- **Response Success (201):** `{ "id": "999" }`

---

## 5. Módulo de Dashboard

### Obtener Estadísticas Diarias
- **Path:** `GET /api/v1/loans/dashboard`
- **Parámetros (URL Query):** `userId`?, `companyId`?
- **Response Success (200):**
  ```json
  {
    "totalLentToday": 1000.0,
    "collectedToday": 450.0,
    "activeClients": 15,
    "totalExpensesToday": 100.0,
    "thermometer": 85.5,
    "userId": "1",
    "companyId": "1",
    "detailCollectedToday": { "yape": 200.0, "efectivo": 250.0 },
    "pendingLoans": [ { "id": "500", "clientName": "John Doe", "remainingAmount": 450.0 } ]
  }
  ```

---

## 6. Módulo de Gastos (`/expenses`)

### Listar Gastos
- **Path:** `GET /api/v1/expenses`
- **Parámetros (URL Query):** `userId`?, `startDate`?, `endDate`?
- **Response Success (200):**
  ```json
  [
    {
      "id": "1",
      "description": "Gasolina",
      "amount": 20.0,
      "date": "2024-03-01T15:00:00Z",
      "userId": "1"
    }
  ]
  ```

### Registrar Nuevo Gasto
- **Path:** `POST /api/v1/expenses`
- **Request Body (JSON):**
  ```json
  {
    "description": "Reparación de motocicleta",
    "amount": 45.0,
    "userId": "1"
  }
  ```

---

## 7. Módulo de Empresas (`/companies`)

### Listar Empresas
- **Path:** `GET /api/v1/companies`
- **Response Success (200):**
  ```json
  [
    {
      "id": "1",
      "companyName": "Inversiones El Sol",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "label": "SOL"
    }
  ]
  ```

---

> [!IMPORTANT]
> - Todos los **IDs** deben ser tratados como **strings**.
