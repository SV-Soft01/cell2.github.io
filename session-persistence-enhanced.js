// Archivo mejorado para mantener la sesión persistente y evitar cierres automáticos

// Variables para controlar la sesión
let ultimaActividad = Date.now()
const TIEMPO_INACTIVIDAD_MAX = 3600000 // 1 hora en milisegundos
let sesionRenovada = false

// Función para mantener la sesión activa
function configurarSesionPersistente() {
  console.log("Configurando sesión persistente mejorada...")

  // Guardar la sesión en localStorage además de sessionStorage
  const currentUser = sessionStorage.getItem("currentUser")
  if (currentUser) {
    localStorage.setItem("persistentUser", currentUser)
    localStorage.setItem("ultimaActividad", Date.now().toString())
  }

  // Verificar al cargar la página si hay una sesión persistente
  const persistentUser = localStorage.getItem("persistentUser")
  if (persistentUser && !sessionStorage.getItem("currentUser")) {
    // Verificar si la sesión no ha expirado por inactividad
    const ultimaActividadGuardada = Number.parseInt(localStorage.getItem("ultimaActividad") || "0")
    const ahora = Date.now()

    if (ahora - ultimaActividadGuardada < TIEMPO_INACTIVIDAD_MAX) {
      // La sesión aún es válida, restaurarla
      sessionStorage.setItem("currentUser", persistentUser)
      console.log("Sesión restaurada desde almacenamiento persistente")
    } else {
      console.log("Sesión expirada por inactividad, requiere nuevo inicio de sesión")
      // No restaurar la sesión, requerir nuevo inicio de sesión
      localStorage.removeItem("persistentUser")
    }
  }

  // Registrar actividad del usuario
  function registrarActividad() {
    ultimaActividad = Date.now()
    localStorage.setItem("ultimaActividad", ultimaActividad.toString())

    // Renovar la sesión si es necesario
    if (!sesionRenovada) {
      const currentUser = sessionStorage.getItem("currentUser")
      if (currentUser) {
        sessionStorage.setItem("currentUser", currentUser)
        localStorage.setItem("persistentUser", currentUser)
        sesionRenovada = true

        // Reiniciar el flag después de un tiempo
        setTimeout(() => {
          sesionRenovada = false
        }, 60000) // 1 minuto
      }
    }
  }

  // Eventos para detectar actividad del usuario
  const eventosActividad = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"]

  eventosActividad.forEach((evento) => {
    document.addEventListener(evento, registrarActividad, { passive: true })
  })

  // Sobrescribir el evento beforeunload para evitar cierre de sesión accidental
  window.addEventListener("beforeunload", (event) => {
    // Guardar la sesión actual en localStorage
    const currentUser = sessionStorage.getItem("currentUser")
    if (currentUser) {
      localStorage.setItem("persistentUser", currentUser)
      localStorage.setItem("ultimaActividad", Date.now().toString())
    }
  })

  // Verificar sesión cada minuto para mantenerla activa
  setInterval(() => {
    const currentUser = sessionStorage.getItem("currentUser")
    if (currentUser) {
      // Verificar si ha pasado demasiado tiempo sin actividad
      const tiempoInactivo = Date.now() - ultimaActividad

      if (tiempoInactivo < TIEMPO_INACTIVIDAD_MAX) {
        // Renovar la sesión
        sessionStorage.setItem("currentUser", currentUser)
        localStorage.setItem("persistentUser", currentUser)
        console.log("Sesión renovada automáticamente")
      } else {
        // No cerrar la sesión, pero mostrar advertencia
        console.warn("Inactividad detectada. La sesión podría expirar pronto.")

        // Mostrar notificación al usuario
        mostrarNotificacionInactividad()
      }
    }
  }, 60000) // Cada minuto

  // Función para mostrar notificación de inactividad
  function mostrarNotificacionInactividad() {
    // Verificar si ya existe una notificación
    if (document.getElementById("inactivity-notification")) return

    const notificacion = document.createElement("div")
    notificacion.id = "inactivity-notification"
    notificacion.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px 15px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
    `

    notificacion.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <div>
        <strong>Inactividad detectada</strong>
        <p>Haga clic en cualquier lugar para mantener su sesión activa.</p>
      </div>
      <button id="dismiss-inactivity" style="background: none; border: none; cursor: pointer;">
        <i class="fas fa-times"></i>
      </button>
    `

    document.body.appendChild(notificacion)

    // Eliminar notificación al hacer clic en ella
    notificacion.addEventListener("click", () => {
      registrarActividad()
      document.body.removeChild(notificacion)
    })

    // Eliminar notificación después de 30 segundos
    setTimeout(() => {
      if (document.getElementById("inactivity-notification")) {
        document.body.removeChild(notificacion)
      }
    }, 30000)
  }

  console.log("Configuración de sesión persistente mejorada completada")
}

// Función para prevenir el cierre de la aplicación
function prevenirCierreAplicacion() {
  // Interceptar navegación a otras páginas
  window.addEventListener("beforeunload", (event) => {
    // Solo prevenir si no es un cierre de sesión explícito
    if (!window.cierreExplicito) {
      const mensaje =
        "¿Está seguro que desea salir? Se recomienda usar el botón 'Salir' para cerrar sesión correctamente."
      event.returnValue = mensaje
      return mensaje
    }
  })

  // Interceptar clics en enlaces externos
  document.addEventListener("click", (event) => {
    const target = event.target.closest("a")
    if (target && target.href && !target.href.includes("javascript:") && !target.getAttribute("download")) {
      // Verificar si es un enlace externo
      if (target.hostname !== window.location.hostname || target.pathname === "/login.html") {
        event.preventDefault()

        if (
          confirm(
            "¿Está seguro que desea navegar fuera de la aplicación? Se recomienda usar el botón 'Salir' para cerrar sesión correctamente.",
          )
        ) {
          window.cierreExplicito = true
          window.location.href = target.href
        }
      }
    }
  })

  console.log("Prevención de cierre de aplicación configurada")
}

// Función para verificar si es un nuevo día
function esNuevoDia() {
  const ultimoAcceso = localStorage.getItem("ultimoAccesoDia")
  const fechaActual = new Date().toDateString()

  if (ultimoAcceso !== fechaActual) {
    localStorage.setItem("ultimoAccesoDia", fechaActual)
    return true
  }

  return false
}

// Función para mostrar mensaje de bienvenida al inicio del día
function mostrarMensajeBienvenida() {
  if (esNuevoDia()) {
    const usuario = JSON.parse(sessionStorage.getItem("currentUser") || localStorage.getItem("persistentUser") || "{}")

    if (usuario && usuario.nombre) {
      const mensaje = document.createElement("div")
      mensaje.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        text-align: center;
        max-width: 400px;
      `

      mensaje.innerHTML = `
        <h3>¡Buenos días, ${usuario.nombre}!</h3>
        <p>Bienvenido/a a un nuevo día de trabajo.</p>
        <p>Los datos se han sincronizado automáticamente.</p>
        <button id="cerrar-bienvenida" style="
          background-color: #4a6da7;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        ">Entendido</button>
      `

      document.body.appendChild(mensaje)

      document.getElementById("cerrar-bienvenida").addEventListener("click", () => {
        document.body.removeChild(mensaje)
      })

      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => {
        if (document.body.contains(mensaje)) {
          document.body.removeChild(mensaje)
        }
      }, 5000)
    }
  }
}

// Exportar funciones para uso global
window.configurarSesionPersistente = configurarSesionPersistente
window.prevenirCierreAplicacion = prevenirCierreAplicacion
window.esNuevoDia = esNuevoDia
window.mostrarMensajeBienvenida = mostrarMensajeBienvenida

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  configurarSesionPersistente()
  prevenirCierreAplicacion()
  mostrarMensajeBienvenida()
  console.log("Sistema de persistencia de sesión mejorado inicializado")
})

