// Archivo para mantener la sesión persistente y evitar cierres automáticos

// Función para mantener la sesión activa
function configurarSesionPersistente() {
    console.log("Configurando sesión persistente...")
  
    // Guardar la sesión en localStorage además de sessionStorage
    const currentUser = sessionStorage.getItem("currentUser")
    if (currentUser) {
      localStorage.setItem("persistentUser", currentUser)
    }
  
    // Verificar al cargar la página si hay una sesión persistente
    const persistentUser = localStorage.getItem("persistentUser")
    if (persistentUser && !sessionStorage.getItem("currentUser")) {
      sessionStorage.setItem("currentUser", persistentUser)
      console.log("Sesión restaurada desde almacenamiento persistente")
    }
  
    // Sobrescribir el evento beforeunload para evitar cierre de sesión accidental
    window.addEventListener("beforeunload", (event) => {
      // No hacer nada, solo prevenir el comportamiento por defecto
      // que podría cerrar la sesión
      const currentUser = sessionStorage.getItem("currentUser")
      if (currentUser) {
        localStorage.setItem("persistentUser", currentUser)
      }
    })
  
    console.log("Configuración de sesión persistente completada")
  }
  
  // Verificar sesión cada minuto para mantenerla activa
  setInterval(() => {
    const currentUser = sessionStorage.getItem("currentUser")
    if (currentUser) {
      // Renovar la sesión
      sessionStorage.setItem("currentUser", currentUser)
      localStorage.setItem("persistentUser", currentUser)
      console.log("Sesión renovada automáticamente")
    }
  }, 60000) // Cada minuto
  
  // Inicializar al cargar la página
  document.addEventListener("DOMContentLoaded", () => {
    configurarSesionPersistente()
    console.log("Sistema de persistencia de sesión inicializado")
  })
  
  // Exportar función para uso global
  window.configurarSesionPersistente = configurarSesionPersistente
  
  