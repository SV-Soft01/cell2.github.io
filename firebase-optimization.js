// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js"
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js"

// Usar la misma configuración de Firebase que ya tienes
const firebaseConfig = {
  apiKey: "AIzaSyDKZ6zUWN9Oa3BqvdUOlDwUtMDT18V_V7U",
  authDomain: "tienda-de-celulares-23e65.firebaseapp.com",
  projectId: "tienda-de-celulares-23e65",
  storageBucket: "tienda-de-celulares-23e65.firebasestorage.app",
  messagingSenderId: "90520827298",
  appId: "1:90520827298:web:290fd6d2c677f7364faefb",
  measurementId: "G-SVN61V3YY0",
}

// Inicializar Firebase
console.log("Inicializando Firebase Optimization...")
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Variable para controlar si ya se han cargado los datos iniciales
let datosInicialesYaCargados = false

// ===== FUNCIONES DE CONSOLIDACIÓN DE DATOS =====

// 1. Consolidar productos de inventario en un solo documento
async function consolidarInventario() {
  try {
    console.log("Consolidando inventario en un solo documento...")

    // Obtener todos los productos individuales
    const querySnapshot = await getDocs(collection(db, "productos"))
    const productos = []

    querySnapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Guardar todos los productos en un solo documento
    await setDoc(doc(db, "consolidado", "inventario"), {
      productos: productos,
      lastUpdate: Date.now(),
    })

    console.log(`${productos.length} productos consolidados correctamente`)

    // Guardar en localStorage para acceso offline
    localStorage.setItem("inventarioConsolidado", JSON.stringify(productos))
    localStorage.setItem("inventarioTimestamp", Date.now().toString())

    return productos
  } catch (error) {
    console.error("Error al consolidar inventario:", error)
    return null
  }
}

// 2. Cargar inventario desde documento consolidado (UNA SOLA LECTURA)
async function cargarInventarioConsolidado() {
  try {
    console.log("Cargando inventario desde documento consolidado...")

    // Verificar si tenemos datos en caché y si son recientes (menos de 24 horas)
    const cachedData = localStorage.getItem("inventarioConsolidado")
    const timestamp = localStorage.getItem("inventarioTimestamp")
    const isRecent = timestamp && Date.now() - Number.parseInt(timestamp) < 24 * 60 * 60 * 1000

    if (cachedData && isRecent) {
      console.log("Usando inventario en caché (menos de 24 horas)")
      return JSON.parse(cachedData)
    }

    // Si no hay caché o es antigua, cargar desde Firebase (UNA SOLA LECTURA)
    const docSnap = await getDoc(doc(db, "consolidado", "inventario"))

    if (docSnap.exists()) {
      const data = docSnap.data()
      const productos = data.productos || []

      // Guardar en localStorage para acceso offline
      localStorage.setItem("inventarioConsolidado", JSON.stringify(productos))
      localStorage.setItem("inventarioTimestamp", Date.now().toString())

      console.log(`${productos.length} productos cargados desde documento consolidado`)
      return productos
    } else {
      console.log("No existe documento consolidado, creando uno...")
      return await consolidarInventario()
    }
  } catch (error) {
    console.error("Error al cargar inventario consolidado:", error)

    // Si hay error, intentar usar caché aunque sea antigua
    const cachedData = localStorage.getItem("inventarioConsolidado")
    if (cachedData) {
      console.log("Usando caché local debido a error")
      return JSON.parse(cachedData)
    }

    return []
  }
}

// 3. Guardar un producto en el inventario consolidado
async function guardarProductoConsolidado(producto) {
  try {
    console.log("Guardando producto en inventario consolidado:", producto)

    // Obtener el documento consolidado actual
    const docSnap = await getDoc(doc(db, "consolidado", "inventario"))

    if (!docSnap.exists()) {
      // Si no existe, crear uno nuevo
      await consolidarInventario()
      return guardarProductoConsolidado(producto)
    }

    // Actualizar el array de productos
    const data = docSnap.data()
    const productos = data.productos || []

    // Buscar si el producto ya existe
    const index = productos.findIndex((p) => p.id === producto.id || p.codigoProducto === producto.codigoProducto)

    if (index >= 0) {
      // Actualizar producto existente
      productos[index] = {
        ...producto,
        id: productos[index].id, // Mantener el ID original
      }
    } else {
      // Añadir nuevo producto con ID
      if (!producto.id) {
        producto.id = Date.now().toString()
      }
      productos.push(producto)
    }

    // Guardar el documento actualizado
    await setDoc(doc(db, "consolidado", "inventario"), {
      productos: productos,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem("inventarioConsolidado", JSON.stringify(productos))
    localStorage.setItem("inventarioTimestamp", Date.now().toString())

    console.log("Producto guardado en documento consolidado")
    return true
  } catch (error) {
    console.error("Error al guardar producto consolidado:", error)
    return false
  }
}

// 4. Eliminar un producto del inventario consolidado
async function eliminarProductoConsolidado(productoId) {
  try {
    console.log("Eliminando producto del inventario consolidado:", productoId)

    // Obtener el documento consolidado actual
    const docSnap = await getDoc(doc(db, "consolidado", "inventario"))

    if (!docSnap.exists()) {
      console.error("No existe documento consolidado")
      return false
    }

    // Filtrar el producto a eliminar
    const data = docSnap.data()
    let productos = data.productos || []
    productos = productos.filter((p) => p.id !== productoId && p.codigoProducto !== productoId)

    // Guardar el documento actualizado
    await setDoc(doc(db, "consolidado", "inventario"), {
      productos: productos,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem("inventarioConsolidado", JSON.stringify(productos))
    localStorage.setItem("inventarioTimestamp", Date.now().toString())

    console.log("Producto eliminado del documento consolidado")
    return true
  } catch (error) {
    console.error("Error al eliminar producto consolidado:", error)
    return false
  }
}

// 5. Consolidar registros por tipo (facturas, compras, etc.)
async function consolidarRegistros(tipo) {
  try {
    console.log(`Consolidando registros de tipo ${tipo}...`)

    // Obtener todos los registros individuales
    const querySnapshot = await getDocs(collection(db, tipo))
    const registros = []

    querySnapshot.forEach((doc) => {
      registros.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Guardar todos los registros en un solo documento
    await setDoc(doc(db, "consolidado", `registros-${tipo}`), {
      registros: registros,
      lastUpdate: Date.now(),
    })

    // Guardar en localStorage para acceso offline
    localStorage.setItem(`registros-${tipo}`, JSON.stringify(registros))
    localStorage.setItem(`registros-${tipo}-timestamp`, Date.now().toString())

    console.log(`${registros.length} registros de tipo ${tipo} consolidados`)
    return registros
  } catch (error) {
    console.error(`Error al consolidar registros de ${tipo}:`, error)
    return []
  }
}

// 6. Cargar registros consolidados (UNA SOLA LECTURA)
async function cargarRegistrosConsolidados(tipo) {
  try {
    console.log(`Cargando registros de tipo ${tipo}...`)

    // Verificar si tenemos datos en caché y si son recientes (menos de 24 horas)
    const cachedData = localStorage.getItem(`registros-${tipo}`)
    const timestamp = localStorage.getItem(`registros-${tipo}-timestamp`)
    const isRecent = timestamp && Date.now() - Number.parseInt(timestamp) < 24 * 60 * 60 * 1000

    if (cachedData && isRecent) {
      console.log(`Usando registros de ${tipo} en caché (menos de 24 horas)`)
      return JSON.parse(cachedData)
    }

    // Si no hay caché o es antigua, cargar desde Firebase (UNA SOLA LECTURA)
    const docSnap = await getDoc(doc(db, "consolidado", `registros-${tipo}`))

    if (docSnap.exists()) {
      const data = docSnap.data()
      const registros = data.registros || []

      // Guardar en localStorage para acceso offline
      localStorage.setItem(`registros-${tipo}`, JSON.stringify(registros))
      localStorage.setItem(`registros-${tipo}-timestamp`, Date.now().toString())

      console.log(`${registros.length} registros de tipo ${tipo} cargados`)
      return registros
    } else {
      console.log(`No existe documento consolidado para ${tipo}, creando uno...`)
      return await consolidarRegistros(tipo)
    }
  } catch (error) {
    console.error(`Error al cargar registros de ${tipo}:`, error)

    // Si hay error, intentar usar caché aunque sea antigua
    const cachedData = localStorage.getItem(`registros-${tipo}`)
    if (cachedData) {
      console.log(`Usando caché local de ${tipo} debido a error`)
      return JSON.parse(cachedData)
    }

    return []
  }
}

// 7. Guardar un nuevo registro en el tipo correspondiente
async function guardarRegistroConsolidado(registro, tipo) {
  try {
    console.log(`Guardando registro en ${tipo}:`, registro)

    // Obtener el documento consolidado actual
    const docSnap = await getDoc(doc(db, "consolidado", `registros-${tipo}`))

    if (!docSnap.exists()) {
      // Si no existe, crear uno nuevo
      await consolidarRegistros(tipo)
      return guardarRegistroConsolidado(registro, tipo)
    }

    // Actualizar el array de registros
    const data = docSnap.data()
    const registros = data.registros || []

    // Buscar si el registro ya existe
    const index = registros.findIndex((r) => r.id === registro.id)

    if (index >= 0) {
      // Actualizar registro existente
      registros[index] = {
        ...registro,
        id: registros[index].id, // Mantener el ID original
      }
    } else {
      // Añadir nuevo registro con ID
      if (!registro.id) {
        registro.id = Date.now().toString()
      }
      registros.push(registro)
    }

    // Guardar el documento actualizado
    await setDoc(doc(db, "consolidado", `registros-${tipo}`), {
      registros: registros,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem(`registros-${tipo}`, JSON.stringify(registros))
    localStorage.setItem(`registros-${tipo}-timestamp`, Date.now().toString())

    console.log(`Registro guardado en ${tipo}`)
    return true
  } catch (error) {
    console.error(`Error al guardar registro en ${tipo}:`, error)
    return false
  }
}

// 8. Consolidar clientes y proveedores
async function consolidarContactos(tipo) {
  try {
    console.log(`Consolidando ${tipo}...`)

    // Obtener todos los contactos individuales
    const querySnapshot = await getDocs(collection(db, tipo))
    const contactos = []

    querySnapshot.forEach((doc) => {
      contactos.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Guardar todos los contactos en un solo documento
    await setDoc(doc(db, "consolidado", tipo), {
      contactos: contactos,
      lastUpdate: Date.now(),
    })

    // Guardar en localStorage para acceso offline
    localStorage.setItem(`${tipo}Consolidado`, JSON.stringify(contactos))
    localStorage.setItem(`${tipo}Timestamp`, Date.now().toString())

    console.log(`${contactos.length} ${tipo} consolidados`)
    return contactos
  } catch (error) {
    console.error(`Error al consolidar ${tipo}:`, error)
    return []
  }
}

// 9. Cargar clientes o proveedores consolidados
async function cargarContactosConsolidados(tipo) {
  try {
    console.log(`Cargando ${tipo}...`)

    // Verificar si tenemos datos en caché y si son recientes (menos de 24 horas)
    const cachedData = localStorage.getItem(`${tipo}Consolidado`)
    const timestamp = localStorage.getItem(`${tipo}Timestamp`)
    const isRecent = timestamp && Date.now() - Number.parseInt(timestamp) < 24 * 60 * 60 * 1000

    if (cachedData && isRecent) {
      console.log(`Usando ${tipo} en caché (menos de 24 horas)`)
      return JSON.parse(cachedData)
    }

    // Si no hay caché o es antigua, cargar desde Firebase (UNA SOLA LECTURA)
    const docSnap = await getDoc(doc(db, "consolidado", tipo))

    if (docSnap.exists()) {
      const data = docSnap.data()
      const contactos = data.contactos || []

      // Guardar en localStorage para acceso offline
      localStorage.setItem(`${tipo}Consolidado`, JSON.stringify(contactos))
      localStorage.setItem(`${tipo}Timestamp`, Date.now().toString())

      console.log(`${contactos.length} ${tipo} cargados`)
      return contactos
    } else {
      console.log(`No existe documento consolidado para ${tipo}, creando uno...`)
      return await consolidarContactos(tipo)
    }
  } catch (error) {
    console.error(`Error al cargar ${tipo}:`, error)

    // Si hay error, intentar usar caché aunque sea antigua
    const cachedData = localStorage.getItem(`${tipo}Consolidado`)
    if (cachedData) {
      console.log(`Usando caché local de ${tipo} debido a error`)
      return JSON.parse(cachedData)
    }

    return []
  }
}

// 10. Consolidar usuarios y configuración
async function consolidarConfiguracion() {
  try {
    console.log("Consolidando usuarios y configuración...")

    // Obtener usuarios
    const usuarios = (await window.getUsersFromFirebase)
      ? await window.getUsersFromFirebase()
      : JSON.parse(localStorage.getItem("inventoryUsers") || "[]")

    // Obtener información de la empresa
    const companyInfo = (await window.getCompanyInfoFromFirebase)
      ? await window.getCompanyInfoFromFirebase()
      : JSON.parse(localStorage.getItem("companyInfo") || "{}")

    // Obtener contraseña de administración
    const adminPassword = (await window.getAdminPasswordFromFirebase)
      ? await window.getAdminPasswordFromFirebase()
      : localStorage.getItem("adminPassword") || "12345"

    // Guardar todo en un solo documento
    await setDoc(doc(db, "consolidado", "configuracion"), {
      usuarios: usuarios,
      companyInfo: companyInfo,
      adminPassword: adminPassword,
      lastUpdate: Date.now(),
    })

    console.log("Configuración consolidada correctamente")
    return { usuarios, companyInfo, adminPassword }
  } catch (error) {
    console.error("Error al consolidar configuración:", error)
    return null
  }
}

// 11. Cargar configuración consolidada
async function cargarConfiguracionConsolidada() {
  try {
    console.log("Cargando configuración consolidada...")

    // Una sola operación de lectura
    const docSnap = await getDoc(doc(db, "consolidado", "configuracion"))

    if (docSnap.exists()) {
      const data = docSnap.data()

      // Guardar en localStorage para acceso offline
      if (data.usuarios) {
        localStorage.setItem("inventoryUsers", JSON.stringify(data.usuarios))
      }

      if (data.companyInfo) {
        localStorage.setItem("companyInfo", JSON.stringify(data.companyInfo))
      }

      if (data.adminPassword) {
        localStorage.setItem("adminPassword", data.adminPassword)
      }

      console.log("Configuración cargada desde documento consolidado")
      return data
    } else {
      console.log("No existe documento de configuración consolidado, creando uno...")
      return await consolidarConfiguracion()
    }
  } catch (error) {
    console.error("Error al cargar configuración consolidada:", error)

    // Usar datos locales si hay error
    return {
      usuarios: JSON.parse(localStorage.getItem("inventoryUsers") || "[]"),
      companyInfo: JSON.parse(localStorage.getItem("companyInfo") || "{}"),
      adminPassword: localStorage.getItem("adminPassword") || "12345",
    }
  }
}

// 12. Consolidar datos de capital
async function consolidarCapital() {
  try {
    console.log("Consolidando datos de capital...")

    // Obtener todos los registros de capital
    const querySnapshot = await getDocs(collection(db, "capital"))
    const registrosCapital = []

    querySnapshot.forEach((doc) => {
      registrosCapital.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Guardar todos los registros en un solo documento
    await setDoc(doc(db, "consolidado", "capital"), {
      registros: registrosCapital,
      lastUpdate: Date.now(),
    })

    // Guardar en localStorage para acceso offline
    localStorage.setItem("capitalConsolidado", JSON.stringify(registrosCapital))
    localStorage.setItem("capitalTimestamp", Date.now().toString())

    console.log(`${registrosCapital.length} registros de capital consolidados`)
    return registrosCapital
  } catch (error) {
    console.error("Error al consolidar capital:", error)
    return []
  }
}

// 13. Cargar datos de capital consolidados
async function cargarCapitalConsolidado() {
  try {
    console.log("Cargando datos de capital...")

    // Verificar si tenemos datos en caché y si son recientes (menos de 24 horas)
    const cachedData = localStorage.getItem("capitalConsolidado")
    const timestamp = localStorage.getItem("capitalTimestamp")
    const isRecent = timestamp && Date.now() - Number.parseInt(timestamp) < 24 * 60 * 60 * 1000

    if (cachedData && isRecent) {
      console.log("Usando datos de capital en caché (menos de 24 horas)")
      return JSON.parse(cachedData)
    }

    // Si no hay caché o es antigua, cargar desde Firebase (UNA SOLA LECTURA)
    const docSnap = await getDoc(doc(db, "consolidado", "capital"))

    if (docSnap.exists()) {
      const data = docSnap.data()
      const registros = data.registros || []

      // Guardar en localStorage para acceso offline
      localStorage.setItem("capitalConsolidado", JSON.stringify(registros))
      localStorage.setItem("capitalTimestamp", Date.now().toString())

      console.log(`${registros.length} registros de capital cargados`)
      return registros
    } else {
      console.log("No existe documento consolidado para capital, creando uno...")
      return await consolidarCapital()
    }
  } catch (error) {
    console.error("Error al cargar capital consolidado:", error)

    // Si hay error, intentar usar caché aunque sea antigua
    const cachedData = localStorage.getItem("capitalConsolidado")
    if (cachedData) {
      console.log("Usando caché local de capital debido a error")
      return JSON.parse(cachedData)
    }

    return []
  }
}

// 14. Guardar un nuevo registro de capital
async function guardarCapitalConsolidado(registro) {
  try {
    console.log("Guardando registro de capital:", registro)

    // Obtener el documento consolidado actual
    const docSnap = await getDoc(doc(db, "consolidado", "capital"))

    if (!docSnap.exists()) {
      // Si no existe, crear uno nuevo
      await consolidarCapital()
      return guardarCapitalConsolidado(registro)
    }

    // Actualizar el array de registros
    const data = docSnap.data()
    const registros = data.registros || []

    // Buscar si el registro ya existe
    const index = registros.findIndex((r) => r.id === registro.id)

    if (index >= 0) {
      // Actualizar registro existente
      registros[index] = {
        ...registro,
        id: registros[index].id, // Mantener el ID original
      }
    } else {
      // Añadir nuevo registro con ID
      if (!registro.id) {
        registro.id = Date.now().toString()
      }
      registros.push(registro)
    }

    // Guardar el documento actualizado
    await setDoc(doc(db, "consolidado", "capital"), {
      registros: registros,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem("capitalConsolidado", JSON.stringify(registros))
    localStorage.setItem("capitalTimestamp", Date.now().toString())

    console.log("Registro de capital guardado")
    return true
  } catch (error) {
    console.error("Error al guardar registro de capital:", error)
    return false
  }
}

// 15. Consolidar ingresos y gastos
async function consolidarIngresosGastos() {
  try {
    console.log("Consolidando ingresos y gastos...")

    // Obtener todos los registros de ingresos
    const ingresosSnapshot = await getDocs(collection(db, "ingresos"))
    const ingresos = []

    ingresosSnapshot.forEach((doc) => {
      ingresos.push({
        id: doc.id,
        tipo: "ingreso",
        ...doc.data(),
      })
    })

    // Obtener todos los registros de gastos
    const gastosSnapshot = await getDocs(collection(db, "gastos"))
    const gastos = []

    gastosSnapshot.forEach((doc) => {
      gastos.push({
        id: doc.id,
        tipo: "gasto",
        ...doc.data(),
      })
    })

    // Combinar todos los registros
    const movimientos = [...ingresos, ...gastos]

    // Guardar todos los registros en un solo documento
    await setDoc(doc(db, "consolidado", "ingresos-gastos"), {
      movimientos: movimientos,
      lastUpdate: Date.now(),
    })

    // Guardar en localStorage para acceso offline
    localStorage.setItem("ingresosGastosConsolidado", JSON.stringify(movimientos))
    localStorage.setItem("ingresosGastosTimestamp", Date.now().toString())

    console.log(`${movimientos.length} registros de ingresos y gastos consolidados`)
    return movimientos
  } catch (error) {
    console.error("Error al consolidar ingresos y gastos:", error)
    return []
  }
}

// 16. Cargar ingresos y gastos consolidados
async function cargarIngresosGastosConsolidados() {
  try {
    console.log("Cargando ingresos y gastos...")

    // Verificar si tenemos datos en caché y si son recientes (menos de 24 horas)
    const cachedData = localStorage.getItem("ingresosGastosConsolidado")
    const timestamp = localStorage.getItem("ingresosGastosTimestamp")
    const isRecent = timestamp && Date.now() - Number.parseInt(timestamp) < 24 * 60 * 60 * 1000

    if (cachedData && isRecent) {
      console.log("Usando ingresos y gastos en caché (menos de 24 horas)")
      return JSON.parse(cachedData)
    }

    // Si no hay caché o es antigua, cargar desde Firebase (UNA SOLA LECTURA)
    const docSnap = await getDoc(doc(db, "consolidado", "ingresos-gastos"))

    if (docSnap.exists()) {
      const data = docSnap.data()
      const movimientos = data.movimientos || []

      // Guardar en localStorage para acceso offline
      localStorage.setItem("ingresosGastosConsolidado", JSON.stringify(movimientos))
      localStorage.setItem("ingresosGastosTimestamp", Date.now().toString())

      console.log(`${movimientos.length} registros de ingresos y gastos cargados`)
      return movimientos
    } else {
      console.log("No existe documento consolidado para ingresos y gastos, creando uno...")
      return await consolidarIngresosGastos()
    }
  } catch (error) {
    console.error("Error al cargar ingresos y gastos consolidados:", error)

    // Si hay error, intentar usar caché aunque sea antigua
    const cachedData = localStorage.getItem("ingresosGastosConsolidado")
    if (cachedData) {
      console.log("Usando caché local de ingresos y gastos debido a error")
      return JSON.parse(cachedData)
    }

    return []
  }
}

// 17. Guardar un nuevo ingreso o gasto
async function guardarIngresoGastoConsolidado(movimiento) {
  try {
    console.log("Guardando ingreso/gasto:", movimiento)

    // Obtener el documento consolidado actual
    const docSnap = await getDoc(doc(db, "consolidado", "ingresos-gastos"))

    if (!docSnap.exists()) {
      // Si no existe, crear uno nuevo
      await consolidarIngresosGastos()
      return guardarIngresoGastoConsolidado(movimiento)
    }

    // Actualizar el array de movimientos
    const data = docSnap.data()
    const movimientos = data.movimientos || []

    // Buscar si el movimiento ya existe
    const index = movimientos.findIndex((m) => m.id === movimiento.id)

    if (index >= 0) {
      // Actualizar movimiento existente
      movimientos[index] = {
        ...movimiento,
        id: movimientos[index].id, // Mantener el ID original
      }
    } else {
      // Añadir nuevo movimiento con ID
      if (!movimiento.id) {
        movimiento.id = Date.now().toString()
      }
      movimientos.push(movimiento)
    }

    // Guardar el documento actualizado
    await setDoc(doc(db, "consolidado", "ingresos-gastos"), {
      movimientos: movimientos,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem("ingresosGastosConsolidado", JSON.stringify(movimientos))
    localStorage.setItem("ingresosGastosTimestamp", Date.now().toString())

    console.log("Ingreso/gasto guardado")
    return true
  } catch (error) {
    console.error("Error al guardar ingreso/gasto:", error)
    return false
  }
}

// 18. Función para inicializar todo al cargar la aplicación
async function inicializarDatosConsolidados() {
  try {
    // Evitar cargar múltiples veces
    if (datosInicialesYaCargados) {
      console.log("Los datos ya fueron inicializados anteriormente")
      return true
    }

    console.log("Inicializando datos consolidados...")

    // Cargar configuración (usuarios, empresa, etc.)
    const config = await cargarConfiguracionConsolidada()

    // Cargar inventario
    const productos = await cargarInventarioConsolidado()

    // Cargar otros datos según necesidad
    const facturas = await cargarRegistrosConsolidados("facturas")
    const compras = await cargarRegistrosConsolidados("compras")
    const reparaciones = await cargarRegistrosConsolidados("reparaciones")
    const clientes = await cargarContactosConsolidados("clientes")
    const proveedores = await cargarContactosConsolidados("proveedores")

    // Cargar datos específicos para capital, ingresos/gastos y registros
    const capital = await cargarCapitalConsolidado()
    const ingresosGastos = await cargarIngresosGastosConsolidados()

    console.log("Inicialización de datos consolidados completada")
    datosInicialesYaCargados = true
    return true
  } catch (error) {
    console.error("Error al inicializar datos consolidados:", error)
    return false
  }
}

// ===== INTERCEPTAR FUNCIONES EXISTENTES =====

// Guardar las funciones originales
const funcionesOriginales = {
  // Funciones de Firebase
  getDoc: window.getDoc,
  getDocs: window.getDocs,
  setDoc: window.setDoc,
  updateDoc: window.updateDoc,
  deleteDoc: window.deleteDoc,

  // Funciones específicas de la aplicación
  cargarProductos: window.cargarProductos,
  guardarProducto: window.guardarProducto,
  eliminarProducto: window.eliminarProducto,
  cargarFacturas: window.cargarFacturas,
  guardarFactura: window.guardarFactura,
  cargarClientes: window.cargarClientes,
  guardarCliente: window.guardarCliente,
  cargarReparaciones: window.cargarReparaciones,
  guardarReparacion: window.guardarReparacion,
  cerrarSesion: window.cerrarSesion,

  // Funciones para capital, ingresos/gastos y registros
  cargarCapital: window.cargarCapital,
  guardarCapital: window.guardarCapital,
  cargarIngresos: window.cargarIngresos,
  cargarGastos: window.cargarGastos,
  guardarIngreso: window.guardarIngreso,
  guardarGasto: window.guardarGasto,
  cargarRegistros: window.cargarRegistros,
}

// Reemplazar funciones de carga de productos
if (window.cargarProductos) {
  window.cargarProductos = async () => {
    console.log("Interceptando cargarProductos...")
    const productos = await cargarInventarioConsolidado()

    // Actualizar la tabla de inventario si existe la función
    if (window.actualizarTablaInventario) {
      window.actualizarTablaInventario(productos)
    } else {
      // Actualizar manualmente la tabla
      const cuerpoTabla = document.getElementById("cuerpoTablaInventario")
      if (cuerpoTabla) {
        cuerpoTabla.innerHTML = ""
        productos.forEach((producto, index) => {
          const fila = document.createElement("tr")
          fila.innerHTML = `
            <td>${producto.nombreProducto || ""}</td>
            <td>${producto.codigoProducto || ""}</td>
            <td>${producto.precioCompra || 0}</td>
            <td>${producto.precioVenta || 0}</td>
            <td>${producto.cantidadInventario || 0}</td>
            <td>${producto.cantidadMinima || 0}</td>
            <td>${producto.etiquetaProducto || ""}</td>
            <td>${producto.ubicacionProducto || ""}</td>
            <td>
              <button onclick="editarProducto(${index})" class="edit-btn">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="eliminarProducto(${index})" class="delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `
          cuerpoTabla.appendChild(fila)
        })
      }
    }

    return productos
  }
}

// Reemplazar función de guardar producto
if (window.guardarProducto) {
  window.guardarProducto = async (producto) => {
    console.log("Interceptando guardarProducto...")
    const resultado = await guardarProductoConsolidado(producto)

    // Recargar productos después de guardar
    if (window.cargarProductos) {
      await window.cargarProductos()
    }

    return resultado
  }
}

// Reemplazar función de eliminar producto
if (window.eliminarProducto) {
  window.eliminarProducto = async (index) => {
    console.log("Interceptando eliminarProducto...")

    // Obtener el producto a eliminar
    const productos = await cargarInventarioConsolidado()
    const producto = productos[index]

    if (!producto) {
      console.error("Producto no encontrado en el índice:", index)
      return false
    }

    if (confirm("¿Está seguro que desea eliminar este producto?")) {
      const resultado = await eliminarProductoConsolidado(producto.id)

      // Recargar productos después de eliminar
      if (window.cargarProductos) {
        await window.cargarProductos()
      }

      return resultado
    }

    return false
  }
}

// Reemplazar funciones de facturas
if (window.cargarFacturas) {
  window.cargarFacturas = async () => {
    console.log("Interceptando cargarFacturas...")
    return await cargarRegistrosConsolidados("facturas")
  }
}

if (window.guardarFactura) {
  window.guardarFactura = async (factura) => {
    console.log("Interceptando guardarFactura...")
    return await guardarRegistroConsolidado(factura, "facturas")
  }
}

// Reemplazar funciones de clientes
if (window.cargarClientes) {
  window.cargarClientes = async () => {
    console.log("Interceptando cargarClientes...")
    return await cargarContactosConsolidados("clientes")
  }
}

if (window.guardarCliente) {
  window.guardarCliente = async (cliente) => {
    console.log("Interceptando guardarCliente...")

    // Obtener clientes actuales
    const clientes = await cargarContactosConsolidados("clientes")

    // Buscar si el cliente ya existe
    const index = clientes.findIndex((c) => c.id === cliente.id)

    if (index >= 0) {
      // Actualizar cliente existente
      clientes[index] = {
        ...cliente,
        id: clientes[index].id, // Mantener el ID original
      }
    } else {
      // Añadir nuevo cliente con ID
      if (!cliente.id) {
        cliente.id = Date.now().toString()
      }
      clientes.push(cliente)
    }

    // Guardar en documento consolidado
    await setDoc(doc(db, "consolidado", "clientes"), {
      contactos: clientes,
      lastUpdate: Date.now(),
    })

    // Actualizar caché local
    localStorage.setItem("clientesConsolidado", JSON.stringify(clientes))
    localStorage.setItem("clientesTimestamp", Date.now().toString())

    return true
  }
}

// Reemplazar funciones de reparaciones
if (window.cargarReparaciones) {
  window.cargarReparaciones = async () => {
    console.log("Interceptando cargarReparaciones...")
    return await cargarRegistrosConsolidados("reparaciones")
  }
}

if (window.guardarReparacion) {
  window.guardarReparacion = async (reparacion) => {
    console.log("Interceptando guardarReparacion...")
    return await guardarRegistroConsolidado(reparacion, "reparaciones")
  }
}

// Reemplazar funciones de capital
if (window.cargarCapital) {
  window.cargarCapital = async () => {
    console.log("Interceptando cargarCapital...")
    return await cargarCapitalConsolidado()
  }
}

if (window.guardarCapital) {
  window.guardarCapital = async (registro) => {
    console.log("Interceptando guardarCapital...")
    return await guardarCapitalConsolidado(registro)
  }
}

// Reemplazar funciones de ingresos y gastos
if (window.cargarIngresos) {
  window.cargarIngresos = async () => {
    console.log("Interceptando cargarIngresos...")
    const movimientos = await cargarIngresosGastosConsolidados()
    return movimientos.filter((m) => m.tipo === "ingreso")
  }
}

if (window.cargarGastos) {
  window.cargarGastos = async () => {
    console.log("Interceptando cargarGastos...")
    const movimientos = await cargarIngresosGastosConsolidados()
    return movimientos.filter((m) => m.tipo === "gasto")
  }
}

if (window.guardarIngreso) {
  window.guardarIngreso = async (ingreso) => {
    console.log("Interceptando guardarIngreso...")
    ingreso.tipo = "ingreso"
    return await guardarIngresoGastoConsolidado(ingreso)
  }
}

if (window.guardarGasto) {
  window.guardarGasto = async (gasto) => {
    console.log("Interceptando guardarGasto...")
    gasto.tipo = "gasto"
    return await guardarIngresoGastoConsolidado(gasto)
  }
}

// Reemplazar funciones de registros
if (window.cargarRegistros) {
  window.cargarRegistros = async (tipo) => {
    console.log(`Interceptando cargarRegistros de tipo ${tipo}...`)
    return await cargarRegistrosConsolidados(tipo || "registros")
  }
}

// Modificar la función de cerrar sesión para que solo funcione con el botón explícito
if (window.cerrarSesion) {
  window.cerrarSesionOriginal = window.cerrarSesion

  window.cerrarSesion = () => {
    console.log("Cerrando sesión explícitamente")

    // Eliminar datos de sesión
    sessionStorage.removeItem("currentUser")
    localStorage.removeItem("persistentUser")
    localStorage.removeItem("usuarioActual")

    // Redirigir a login
    window.location.href = "login.html"
  }
}

// Función para mantener la sesión activa
function configurarSesionPersistente() {
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

  console.log("Configuración de sesión persistente completada")
}

// Exportar funciones para uso global
window.consolidarInventario = consolidarInventario
window.cargarInventarioConsolidado = cargarInventarioConsolidado
window.guardarProductoConsolidado = guardarProductoConsolidado
window.eliminarProductoConsolidado = eliminarProductoConsolidado
window.consolidarRegistros = consolidarRegistros
window.cargarRegistrosConsolidados = cargarRegistrosConsolidados
window.guardarRegistroConsolidado = guardarRegistroConsolidado
window.consolidarContactos = consolidarContactos
window.cargarContactosConsolidados = cargarContactosConsolidados
window.consolidarConfiguracion = consolidarConfiguracion
window.cargarConfiguracionConsolidada = cargarConfiguracionConsolidada
window.consolidarCapital = consolidarCapital
window.cargarCapitalConsolidado = cargarCapitalConsolidado
window.guardarCapitalConsolidado = guardarCapitalConsolidado
window.consolidarIngresosGastos = consolidarIngresosGastos
window.cargarIngresosGastosConsolidados = cargarIngresosGastosConsolidados
window.guardarIngresoGastoConsolidado = guardarIngresoGastoConsolidado
window.inicializarDatosConsolidados = inicializarDatosConsolidados
window.configurarSesionPersistente = configurarSesionPersistente

// Inicializar automáticamente
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Inicializando optimizaciones de Firebase...")

  // Configurar sesión persistente
  configurarSesionPersistente()

  // Inicializar datos consolidados
  await inicializarDatosConsolidados()

  console.log("Optimizaciones de Firebase inicializadas correctamente")
})

console.log("Módulo de optimización de Firebase cargado correctamente")

