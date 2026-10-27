# NeoCobros - Plataforma de Gestión de Préstamos y Cobranza

## Resumen del Producto
**NeoCobros** es una plataforma financiera SaaS (Software as a Service) todo en uno, diseñada para prestamistas independientes y equipos de cobranza. Su objetivo principal es automatizar los cobros diarios, calcular cuotas, planificar rutas inteligentes y proporcionar control de indicadores de riesgo en tiempo real. 

El producto resuelve problemas clásicos de la cobranza física (uso de papel, ineficiencia en rutas, cuadres de caja complejos) mediante herramientas digitales modernas y accesibles desde cualquier dispositivo.

## Propuesta de Valor
- **Eficiencia:** Incremento de la eficiencia en rutas (+20%).
- **Digitalización:** Reducción a 0% en la pérdida de datos y eliminación del uso de papel (fichas de cartón).
- **Control en Tiempo Real:** Dashboard centralizado para monitorear ingresos, zonas seguras y rendimiento de los cobradores.

## Características Principales (Core Features)

### 1. Rutas Inteligentes (Optimización Diaria)
El sistema ordena automáticamente la lista de clientes pendientes en una secuencia lógica basada en su ubicación geográfica.
- Minimiza paradas innecesarias.
- Reduce drásticamente los gastos de transporte y combustible.
- Incluye un buscador rápido por nombre o DNI.

### 2. Fichas de Préstamo Digitales y Enlace Web Compartible
Elimina la necesidad de imprimir fichas de cartón frágiles y costosas.
- **Calendario Digital Lunes a Sábado:** Generación de calendario de cuotas e historial de pagos en tiempo real. Excluye automáticamente los domingos (días no laborables de cobranza), protegiendo al prestatario de penalizaciones injustas.
- **Enlace Web Seguro:** Permite al cobrador generar y copiar un enlace público cifrado (AES-256-GCM con vencimiento automático) para compartirlo por WhatsApp u otros medios.
- **Resolución Multi-Tenant:** La URL se adapta dinámicamente al subdominio del cliente SaaS (`https://empresa.neocobros.com/compartir/{token}`).
- **Pantalla de Agradecimiento Institucional:** Al vencer o liquidar el préstamo, muestra un mensaje formal de agradecimiento en nombre del tenant con el pie de marca *Potenciado por NeoCobros*.

### 3. Registro de Gastos Operativos
Permite a los cobradores declarar al instante cualquier egreso de caja realizado durante el día desde la calle (ej. combustible, almuerzos, reparaciones).
- Mantiene sincronizado el saldo neto diario.
- Facilita la validación administrativa.

### 4. Cierre de Caja y Reportes
Control total sobre los movimientos financieros del día, asegurando que el dinero recaudado cuadre con lo reportado en el sistema, descontando los gastos operativos.
- **Visión General:** KPIs consolidados (cobro bruto, gastos, balance neto, eficiencia vs meta) con vistas desktop y mobile optimizadas.
- **Reporte por Cobrador:** Desglose diario de actividad, tabla de pagos y gastos paginada con búsqueda, y cierre de liquidación por cobrador.
- **Evolución del Capital e Inversión:** Métricas patrimoniales avanzadas (capital activo en calle, utilidad neta real acumulada, ROI de cartera) y análisis evolutivo mensual cronológico (MoM) con comparativa de colocación, recupero, margen y flujo neto de caja.


### 5. Indicadores Semáforo (Riesgo y Estado)
Visualización rápida del estado de los préstamos (al día, atrasados, zonas seguras), permitiendo tomar decisiones informadas sobre a quién cobrar primero o qué créditos refinanciar.

### 6. Tareas Programadas y Mantenimiento de Entorno Demo
Rutinas automatizadas para mantener la integridad financiera y el rendimiento del SaaS:
- **Cierre Diario Masivo (23:00 hrs):** Consolidación de saldos, cálculo de morosidad y auditoría de transacciones en `cron_executions`.
- **Cálculo de Score Crediticio (01:00 hrs):** Evaluación algorítmica de prestatarios.
- **Purga de Entorno Demo (02:00 hrs):** Limpieza automática de préstamos, cuotas y gastos de prueba con más de 4 días de antigüedad exclusiva para la empresa `DEMO` (ID 102), con opción de ejecución manual a demanda para el Propietario en `/configuracion/sistema`.

## Arquitectura y Ecosistema
NeoCobros opera mediante una arquitectura multi-tenant (multi-cliente), lo que permite que diferentes empresas de préstamos usen la plataforma bajo sus propios subdominios personalizados (ej. `cliente1.neocobros.com`).
- **Validación de Dominios:** Se integra con `verifyDomain`, una micro-API transversal (Go + Caddy + Redis) que valida subdominios bajo demanda y emite certificados SSL/TLS (On-Demand TLS). Es compartida entre proyectos.
- **Backend:** Manejado a través de `PrestamosApi`, que centraliza el registro de clientes, configuración de caché en Redis y manejo de transacciones.
- **Frontend / Landing Page:** Página de presentación optimizada para captación de leads y redirección hacia el sistema principal (`webNeocobros`).
