// Script para inicializar la aplicación con las optimizaciones

document.addEventListener("DOMContentLoaded", () => {
    console.log("Inicializando aplicación optimizada...")
  
    // Verificar si es un nuevo día para sincronizar datos
    const esNuevoDia = () => {
      const ultimaFecha = localStorage.getItem("ultimaFechaSincronizacion")
      if (!ultimaFecha) return true
  
      const fechaActual = new Date().toDateString()
      return ultimaFecha !== fechaActual
    }
  
    // Función para inicializar datos
    async function inicializarDatos() {
      try {
        // Si es un nuevo día, forzar sincronización
        if (esNuevoDia()) {
          console.log("Nuevo día detectado, sincronizando datos...")
  
          // Mostrar indicador de carga
          const cargando = document.createElement("div")
          cargando.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          `
  
          cargando.innerHTML = `
            <div style="
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            ">
              <i class="fas fa-sync fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
              <p>Sincronizando datos, por favor espere...</p>
            </div>
          `
  
          document.body.appendChild(cargando)
  
          // Inicializar datos consolidados
          if (window.inicializarDatosConsolidados) {
            await window.inicializarDatosConsolidados()
          }
  
          // Guardar fecha de sincronización
          localStorage.setItem("ultimaFechaSincronizacion", new Date().toDateString())
  
          // Eliminar indicador de carga
          document.body.removeChild(cargando)
        } else {
          // Si no es un nuevo día, cargar desde caché
          console.log("Usando datos en caché (mismo día)")
  
          // Inicializar datos consolidados sin forzar
          if (window.inicializarDatosConsolidados) {
            await window.inicializarDatosConsolidados()
          }
        }
  
        // Inicializar secciones específicas
        if (window.inicializarSecciones) {
          await window.inicializarSecciones()
        }
  
        console.log("Inicialización de datos completada")
      } catch (error) {
        console.error("Error al inicializar datos:", error)
      }
    }
  
    // Función para mostrar información del usuario
    function mostrarInfoUsuario() {
      // Obtener información del usuario desde sessionStorage o localStorage
      const usuarioActual = JSON.parse(
        sessionStorage.getItem("currentUser") || localStorage.getItem("persistentUser") || "{}",
      )
  
      if (usuarioActual && usuarioActual.nombre) {
        document.getElementById("nombreUsuario").textContent = usuarioActual.nombre
  
        // Mostrar el rol del usuario
        const rolElement = document.getElementById("rolUsuario")
        if (rolElement) {
          let rolTexto = "Usuario"
          let rolClase = ""
  
          if (usuarioActual.rol === "admin") {
            rolTexto = "Administrador"
            rolClase = "admin"
          } else if (usuarioActual.rol === "cajero") {
            rolTexto = "Cajero"
            rolClase = "cajero"
          } else if (usuarioActual.rol === "taller") {
            rolTexto = "Técnico de Taller"
            rolClase = "taller"
          }
  
          rolElement.textContent = rolTexto
          rolElement.className = "user-role " + rolClase
        }
      }
    }
  
    // Función para configurar el botón de salir
    function configurarBotonSalir() {
      const botonSalir = document.querySelector(".logout-button")
      if (botonSalir) {
        botonSalir.addEventListener("click", () => {
          // Marcar como cierre explícito
          window.cierreExplicito = true
  
          // Verificar si hay cambios pendientes
          if (window.operacionesPendientes && window.operacionesPendientes.length > 0) {
            if (confirm("Hay cambios pendientes por sincronizar. ¿Desea sincronizarlos antes de salir?")) {
              if (window.sincronizarTodo) {
                window.sincronizarTodo().then(() => {
                  window.cerrarSesion()
                })
                return
              }
            }
          }
  
          // Cerrar sesión normalmente
          window.cerrarSesion()
        })
      }
    }
  
    // Inicializar la aplicación
    inicializarDatos()
    mostrarInfoUsuario()
    configurarBotonSalir()
  
    // Configurar persistencia de sesión mejorada
    if (window.configurarSesionPersistente) {
      window.configurarSesionPersistente()
    }
  
    // Prevenir cierre accidental
    if (window.prevenirCierreAplicacion) {
      window.prevenirCierreAplicacion()
    }
  
    console.log("Aplicación optimizada inicializada correctamente")
  })
  
  