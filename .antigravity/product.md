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

### 2. Fichas de Préstamo Digitales (Sin Impresión)
Elimina la necesidad de imprimir fichas de cartón frágiles y costosas.
- Generación de calendario de cuotas e historial de pagos de manera digital.
- Historial transparente y ecológico.

### 3. Registro de Gastos Operativos
Permite a los cobradores declarar al instante cualquier egreso de caja realizado durante el día desde la calle (ej. combustible, almuerzos, reparaciones).
- Mantiene sincronizado el saldo neto diario.
- Facilita la validación administrativa.

### 4. Cierre de Caja y Reportes
Control total sobre los movimientos financieros del día, asegurando que el dinero recaudado cuadre con lo reportado en el sistema, descontando los gastos operativos.
- **Visión General:** KPIs consolidados (cobro bruto, gastos, balance neto, eficiencia vs meta) con vistas desktop y mobile optimizadas.
- **Reporte por Cobrador:** Desglose diario de actividad, tabla de pagos y gastos paginada con búsqueda, y cierre de liquidación por cobrador.

### 5. Indicadores Semáforo (Riesgo y Estado)
Visualización rápida del estado de los préstamos (al día, atrasados, zonas seguras), permitiendo tomar decisiones informadas sobre a quién cobrar primero o qué créditos refinanciar.

## Arquitectura y Ecosistema
NeoCobros opera mediante una arquitectura multi-tenant (multi-cliente), lo que permite que diferentes empresas de préstamos usen la plataforma bajo sus propios subdominios personalizados (ej. `cliente1.neocobros.com`).
- **Validación de Dominios:** Se integra con `verifyDomain`, una micro-API transversal (Go + Caddy + Redis) que valida subdominios bajo demanda y emite certificados SSL/TLS (On-Demand TLS). Es compartida entre proyectos.
- **Backend:** Manejado a través de `PrestamosApi`, que centraliza el registro de clientes, configuración de caché en Redis y manejo de transacciones.
- **Frontend / Landing Page:** Página de presentación optimizada para captación de leads y redirección hacia el sistema principal (`webNeocobros`).
