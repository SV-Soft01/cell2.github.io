# SV-SOFT-TIENDA DE CELULARES

## Descripción
Sistema integral para la gestión de tiendas de celulares y accesorios, con módulos de inventario, facturación, compras, reparaciones, control de capital y más.

## Características Principales

- **Gestión de Inventario**: Control completo de productos, stock, precios y alertas de inventario bajo.
- **Facturación**: Emisión de facturas, control de ventas y gestión de créditos.
- **Taller de Reparación**: Seguimiento de equipos en reparación con estados (pendiente, en proceso, terminado).
- **Control de Compras**: Registro de compras a proveedores y gestión de cuentas por pagar.
- **Control de Capital**: Seguimiento del capital en productos, efectivo y banco.
- **Ingresos y Gastos**: Registro y análisis de movimientos financieros.
- **Clientes y Proveedores**: Base de datos completa de contactos.
- **Cuentas por Cobrar/Pagar**: Gestión de créditos otorgados y recibidos.

## Optimizaciones Implementadas

### Reducción de Lecturas/Escrituras en Firebase

- **Consolidación de Datos**: Todos los datos se almacenan en documentos consolidados en lugar de documentos individuales.
- **Caché Agresiva**: Los datos se cargan una vez al día y se almacenan localmente.
- **Detección de Duplicados**: Prevención automática de registros duplicados.
- **Operaciones en Lote**: Las escrituras se agrupan y se envían en lotes.

### Persistencia de Sesión

- **Sesión Persistente**: La sesión se mantiene activa incluso si se cierra el navegador accidentalmente.
- **Detección de Inactividad**: Notificaciones cuando la sesión está por expirar por inactividad.
- **Prevención de Cierre Accidental**: Confirmación antes de salir de la aplicación.

### Sincronización

- **Sincronización Automática**: Los datos se sincronizan periódicamente (cada 30 minutos).
- **Sincronización Manual**: Botón para forzar la sincronización cuando sea necesario.
- **Sincronización al Cerrar Sesión**: Garantiza que todos los cambios se guarden antes de salir.
- **Indicador de Conexión**: Muestra el estado de la conexión a internet.

## Instrucciones de Uso

### Inicio de Sesión

1. Acceda a la aplicación mediante la página de login.
2. Ingrese sus credenciales (usuario y contraseña).
3. La sesión se mantendrá activa incluso si cierra el navegador.

### Navegación

- Use las tarjetas del dashboard para acceder a los diferentes módulos.
- El botón "Volver al Dashboard" le permite regresar a la pantalla principal.
- Su nombre de usuario y rol se muestran en la parte superior de la pantalla.

### Sincronización de Datos

- **Automática**: Los datos se sincronizan automáticamente cada 30 minutos.
- **Manual**: Presione el botón "Sincronizar" (esquina inferior derecha) para forzar la sincronización.
- **Al Cerrar Sesión**: Siempre use el botón "Salir" para cerrar sesión correctamente y asegurar la sincronización.

### Entorno Multi-dispositivo

Si utiliza la aplicación en múltiples dispositivos simultáneamente:

1. **Sincronización Manual**: Presione "Sincronizar" antes de realizar operaciones importantes.
2. **Cambios No Inmediatos**: Los cambios realizados en un dispositivo no se verán inmediatamente en otros dispositivos hasta que:
   - Se realice una sincronización manual
   - Se active la sincronización automática periódica
   - Sea un nuevo día y se carguen datos frescos
3. **Rutina Recomendada**: Sincronice al iniciar su turno y después de operaciones importantes.

## Solución de Problemas

### Datos No Actualizados

Si nota que los datos no están actualizados:

1. Presione el botón "Sincronizar" para forzar una sincronización manual.
2. Verifique su conexión a internet (indicador en la esquina superior derecha).
3. Si persiste el problema, cierre sesión y vuelva a iniciarla.

### Errores de Sincronización

Si aparecen errores durante la sincronización:

1. Verifique su conexión a internet.
2. Intente sincronizar nuevamente después de unos minutos.
3. Si el problema persiste, contacte al administrador del sistema.

### Sesión Cerrada Inesperadamente

Si su sesión se cierra inesperadamente:

1. Verifique si ha estado inactivo por más de 1 hora.
2. Compruebe si otro usuario ha iniciado sesión con las mismas credenciales.
3. Inicie sesión nuevamente.

## Contacto y Soporte

Para soporte técnico o consultas sobre el sistema, contacte a:

- **Correo**: soporte@svsoft.com
- **Teléfono**: (123) 456-7890

---

© 2024 SV-SOFT. Todos los derechos reservados.
