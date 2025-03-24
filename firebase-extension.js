// Importar las funciones necesarias de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDKZ6zUWN9Oa3BqvdUOlDwUtMDT18V_V7U",
  authDomain: "tienda-de-celulares-23e65.firebaseapp.com",
  projectId: "tienda-de-celulares-23e65",
  storageBucket: "tienda-de-celulares-23e65.firebasestorage.app",
  messagingSenderId: "90520827298",
  appId: "1:90520827298:web:290fd6d2c677f7364faefb",
  measurementId: "G-SVN61V3YY0"
};

// Inicializar Firebase
console.log("Inicializando Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
console.log("Firebase inicializado correctamente");

// Variable para controlar la sincronización automática
let autoSyncEnabled = true;

// Elemento de estado de Firebase
const statusIndicator = document.createElement('div');
statusIndicator.className = 'firebase-status';
statusIndicator.innerHTML = `
  <div class="status-indicator" id="firebaseStatus"></div>
  <span id="firebaseStatusText">Conectando a Firebase...</span>
  <div style="margin-left: 10px; display: flex; align-items: center;">
    <label for="autoSyncToggle" style="margin-right: 5px; font-size: 12px;">Auto:</label>
    <input type="checkbox" id="autoSyncToggle" checked style="margin: 0;">
  </div>
`;
document.body.appendChild(statusIndicator);

// Botón de sincronización
const syncButton = document.createElement('button');
syncButton.className = 'firebase-sync-button';
syncButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar con Firebase';
document.body.appendChild(syncButton);

// Actualizar indicador de estado
function updateFirebaseStatus(isConnected) {
  const statusIndicator = document.getElementById('firebaseStatus');
  const statusText = document.getElementById('firebaseStatusText');
  
  if (isConnected) {
    statusIndicator.classList.add('online');
    statusIndicator.classList.remove('offline');
    statusText.textContent = 'Conectado a Firebase';
  } else {
    statusIndicator.classList.add('offline');
    statusIndicator.classList.remove('online');
    statusText.textContent = 'Desconectado de Firebase';
  }
}

// Estado inicial
updateFirebaseStatus(true);

// Configurar el toggle de sincronización automática
document.addEventListener('DOMContentLoaded', () => {
  const autoSyncToggle = document.getElementById('autoSyncToggle');
  if (autoSyncToggle) {
    autoSyncToggle.addEventListener('change', function() {
      autoSyncEnabled = this.checked;
      showNotification(`Sincronización automática ${autoSyncEnabled ? 'activada' : 'desactivada'}`, 'info');
    });
  }
});

// ===== FUNCIONES PARA INVENTARIO =====

// Función para guardar inventario en Firebase
async function saveInventoryToFirebase(inventario) {
  console.log("Guardando inventario en Firebase...", inventario);
  try {
    // Primero, obtener productos existentes para evitar duplicados
    const existingProducts = await getInventoryFromFirebase();
    const existingCodes = existingProducts.map(p => p.codigo);

    let successCount = 0;
    let updateCount = 0;

    for (const producto of inventario) {
      if (existingCodes.includes(producto.codigo)) {
        // Actualizar producto existente
        const productRef = query(collection(db, "inventario"), where("codigo", "==", producto.codigo));
        const querySnapshot = await getDocs(productRef);

        if (!querySnapshot.empty) {
          const docRef = doc(db, "inventario", querySnapshot.docs[0].id);
          await updateDoc(docRef, producto);
          updateCount++;
        }
      } else {
        // Añadir nuevo producto
        await addDoc(collection(db, "inventario"), producto);
        successCount++;
      }
    }

    console.log(`Guardado en Firebase: ${successCount} productos nuevos, ${updateCount} actualizados`);
    return { success: true, added: successCount, updated: updateCount };
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener inventario desde Firebase
async function getInventoryFromFirebase() {
  console.log("Obteniendo inventario desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "inventario"));
    const productos = [];

    querySnapshot.forEach(doc => {
      productos.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargados ${productos.length} productos desde Firebase`);
    return productos;
  } catch (error) {
    console.error("Error al cargar desde Firebase:", error);
    return [];
  }
}

// Función para eliminar un producto de Firebase
async function deleteProductFromFirebase(codigo) {
  console.log("Eliminando producto de Firebase:", codigo);
  try {
    const productRef = query(collection(db, "inventario"), where("codigo", "==", codigo));
    const querySnapshot = await getDocs(productRef);

    if (!querySnapshot.empty) {
      const docRef = doc(db, "inventario", querySnapshot.docs[0].id);
      await deleteDoc(docRef);
      console.log(`Producto ${codigo} eliminado de Firebase`);
      return { success: true };
    } else {
      console.log(`Producto ${codigo} no encontrado en Firebase`);
      return { success: false, error: "Producto no encontrado" };
    }
  } catch (error) {
    console.error("Error al eliminar de Firebase:", error);
    return { success: false, error: error.message };
  }
}

// ===== FUNCIONES PARA CLIENTES =====

// Función para guardar clientes en Firebase
async function saveCustomersToFirebase(clientes) {
  console.log("Guardando clientes en Firebase...", clientes);
  try {
    const existingCustomers = await getCustomersFromFirebase();
    const existingCodes = existingCustomers.map(c => c.codigo);

    let successCount = 0;
    let updateCount = 0;

    for (const cliente of clientes) {
      if (existingCodes.includes(cliente.codigo)) {
        // Actualizar cliente existente
        const customerRef = query(collection(db, "clientes"), where("codigo", "==", cliente.codigo));
        const querySnapshot = await getDocs(customerRef);

        if (!querySnapshot.empty) {
          const docRef = doc(db, "clientes", querySnapshot.docs[0].id);
          await updateDoc(docRef, cliente);
          updateCount++;
        }
      } else {
        // Añadir nuevo cliente
        await addDoc(collection(db, "clientes"), cliente);
        successCount++;
      }
    }

    console.log(`Guardados en Firebase: ${successCount} clientes nuevos, ${updateCount} actualizados`);
    return { success: true, added: successCount, updated: updateCount };
  } catch (error) {
    console.error("Error al guardar clientes en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener clientes desde Firebase
async function getCustomersFromFirebase() {
  console.log("Obteniendo clientes desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "clientes"));
    const clientes = [];

    querySnapshot.forEach(doc => {
      clientes.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargados ${clientes.length} clientes desde Firebase`);
    return clientes;
  } catch (error) {
    console.error("Error al cargar clientes desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA PROVEEDORES =====

// Función para guardar proveedores en Firebase
async function saveProvidersToFirebase(proveedores) {
  console.log("Guardando proveedores en Firebase...", proveedores);
  try {
    const existingProviders = await getProvidersFromFirebase();
    const existingCodes = existingProviders.map(p => p.codigo);

    let successCount = 0;
    let updateCount = 0;

    for (const proveedor of proveedores) {
      if (existingCodes.includes(proveedor.codigo)) {
        // Actualizar proveedor existente
        const providerRef = query(collection(db, "proveedores"), where("codigo", "==", proveedor.codigo));
        const querySnapshot = await getDocs(providerRef);

        if (!querySnapshot.empty) {
          const docRef = doc(db, "proveedores", querySnapshot.docs[0].id);
          await updateDoc(docRef, proveedor);
          updateCount++;
        }
      } else {
        // Añadir nuevo proveedor
        await addDoc(collection(db, "proveedores"), proveedor);
        successCount++;
      }
    }

    console.log(`Guardados en Firebase: ${successCount} proveedores nuevos, ${updateCount} actualizados`);
    return { success: true, added: successCount, updated: updateCount };
  } catch (error) {
    console.error("Error al guardar proveedores en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener proveedores desde Firebase
async function getProvidersFromFirebase() {
  console.log("Obteniendo proveedores desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "proveedores"));
    const proveedores = [];

    querySnapshot.forEach(doc => {
      proveedores.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargados ${proveedores.length} proveedores desde Firebase`);
    return proveedores;
  } catch (error) {
    console.error("Error al cargar proveedores desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA FACTURAS =====

// Función para guardar facturas en Firebase
async function saveInvoicesToFirebase(facturas) {
  console.log("Guardando facturas en Firebase...", facturas);
  try {
    // Limpiar colección existente
    await clearCollection("facturas");
    
    let count = 0;
    for (const factura of facturas) {
      await addDoc(collection(db, "facturas"), factura);
      count++;
    }
    
    console.log(`Guardadas ${count} facturas en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar facturas en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener facturas desde Firebase
async function getInvoicesFromFirebase() {
  console.log("Obteniendo facturas desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "facturas"));
    const facturas = [];

    querySnapshot.forEach(doc => {
      facturas.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${facturas.length} facturas desde Firebase`);
    return facturas;
  } catch (error) {
    console.error("Error al cargar facturas desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA COMPRAS =====

// Función para guardar compras en Firebase
async function savePurchasesToFirebase(compras) {
  console.log("Guardando compras en Firebase...", compras);
  try {
    // Limpiar colección existente
    await clearCollection("compras");
    
    let count = 0;
    for (const compra of compras) {
      await addDoc(collection(db, "compras"), compra);
      count++;
    }
    
    console.log(`Guardadas ${count} compras en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar compras en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener compras desde Firebase
async function getPurchasesFromFirebase() {
  console.log("Obteniendo compras desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "compras"));
    const compras = [];

    querySnapshot.forEach(doc => {
      compras.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${compras.length} compras desde Firebase`);
    return compras;
  } catch (error) {
    console.error("Error al cargar compras desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA CUENTAS POR COBRAR =====

// Función para guardar cuentas por cobrar en Firebase
async function saveAccountsReceivableToFirebase(cuentasCobrar) {
  console.log("Guardando cuentas por cobrar en Firebase...", cuentasCobrar);
  try {
    // Limpiar colección existente
    await clearCollection("cuentasCobrar");
    
    let count = 0;
    for (const cuenta of cuentasCobrar) {
      await addDoc(collection(db, "cuentasCobrar"), cuenta);
      count++;
    }
    
    console.log(`Guardadas ${count} cuentas por cobrar en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar cuentas por cobrar en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener cuentas por cobrar desde Firebase
async function getAccountsReceivableFromFirebase() {
  console.log("Obteniendo cuentas por cobrar desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "cuentasCobrar"));
    const cuentas = [];

    querySnapshot.forEach(doc => {
      cuentas.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${cuentas.length} cuentas por cobrar desde Firebase`);
    return cuentas;
  } catch (error) {
    console.error("Error al cargar cuentas por cobrar desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA CUENTAS POR PAGAR =====

// Función para guardar cuentas por pagar en Firebase
async function saveAccountsPayableToFirebase(cuentasPagar) {
  console.log("Guardando cuentas por pagar en Firebase...", cuentasPagar);
  try {
    // Limpiar colección existente
    await clearCollection("cuentasPagar");
    
    let count = 0;
    for (const cuenta of cuentasPagar) {
      await addDoc(collection(db, "cuentasPagar"), cuenta);
      count++;
    }
    
    console.log(`Guardadas ${count} cuentas por pagar en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar cuentas por pagar en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener cuentas por pagar desde Firebase
async function getAccountsPayableFromFirebase() {
  console.log("Obteniendo cuentas por pagar desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "cuentasPagar"));
    const cuentas = [];

    querySnapshot.forEach(doc => {
      cuentas.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${cuentas.length} cuentas por pagar desde Firebase`);
    return cuentas;
  } catch (error) {
    console.error("Error al cargar cuentas por pagar desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA REPARACIONES =====

// Función para guardar reparaciones en Firebase
async function saveRepairsToFirebase(reparaciones) {
  console.log("Guardando reparaciones en Firebase...", reparaciones);
  try {
    // Limpiar colección existente
    await clearCollection("reparaciones");
    
    let count = 0;
    for (const reparacion of reparaciones) {
      await addDoc(collection(db, "reparaciones"), reparacion);
      count++;
    }
    
    console.log(`Guardadas ${count} reparaciones en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar reparaciones en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener reparaciones desde Firebase
async function getRepairsFromFirebase() {
  console.log("Obteniendo reparaciones desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "reparaciones"));
    const reparaciones = [];

    querySnapshot.forEach(doc => {
      reparaciones.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${reparaciones.length} reparaciones desde Firebase`);
    return reparaciones;
  } catch (error) {
    console.error("Error al cargar reparaciones desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA REPARACIONES EN PROCESO =====

// Función para guardar reparaciones en proceso en Firebase
async function saveRepairsInProgressToFirebase(reparacionesEnProceso) {
  console.log("Guardando reparaciones en proceso en Firebase...", reparacionesEnProceso);
  try {
    // Limpiar colección existente
    await clearCollection("reparacionesEnProceso");
    
    let count = 0;
    for (const reparacion of reparacionesEnProceso) {
      await addDoc(collection(db, "reparacionesEnProceso"), reparacion);
      count++;
    }
    
    console.log(`Guardadas ${count} reparaciones en proceso en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar reparaciones en proceso en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener reparaciones en proceso desde Firebase
async function getRepairsInProgressFromFirebase() {
  console.log("Obteniendo reparaciones en proceso desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "reparacionesEnProceso"));
    const reparaciones = [];

    querySnapshot.forEach(doc => {
      reparaciones.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${reparaciones.length} reparaciones en proceso desde Firebase`);
    return reparaciones;
  } catch (error) {
    console.error("Error al cargar reparaciones en proceso desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA REPARACIONES TERMINADAS =====

// Función para guardar reparaciones terminadas en Firebase
async function saveCompletedRepairsToFirebase(reparacionesTerminadas) {
  console.log("Guardando reparaciones terminadas en Firebase...", reparacionesTerminadas);
  try {
    // Limpiar colección existente
    await clearCollection("reparacionesTerminadas");
    
    let count = 0;
    for (const reparacion of reparacionesTerminadas) {
      await addDoc(collection(db, "reparacionesTerminadas"), reparacion);
      count++;
    }
    
    console.log(`Guardadas ${count} reparaciones terminadas en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar reparaciones terminadas en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener reparaciones terminadas desde Firebase
async function getCompletedRepairsFromFirebase() {
  console.log("Obteniendo reparaciones terminadas desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "reparacionesTerminadas"));
    const reparaciones = [];

    querySnapshot.forEach(doc => {
      reparaciones.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargadas ${reparaciones.length} reparaciones terminadas desde Firebase`);
    return reparaciones;
  } catch (error) {
    console.error("Error al cargar reparaciones terminadas desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA INGRESOS =====

// Función para guardar ingresos en Firebase
async function saveIncomesToFirebase(ingresos) {
  console.log("Guardando ingresos en Firebase...", ingresos);
  try {
    // Limpiar colección existente
    await clearCollection("ingresos");
    
    let count = 0;
    for (const ingreso of ingresos) {
      await addDoc(collection(db, "ingresos"), ingreso);
      count++;
    }
    
    console.log(`Guardados ${count} ingresos en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar ingresos en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener ingresos desde Firebase
async function getIncomesFromFirebase() {
  console.log("Obteniendo ingresos desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "ingresos"));
    const ingresos = [];

    querySnapshot.forEach(doc => {
      ingresos.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargados ${ingresos.length} ingresos desde Firebase`);
    return ingresos;
  } catch (error) {
    console.error("Error al cargar ingresos desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA GASTOS =====

// Función para guardar gastos en Firebase
async function saveExpensesToFirebase(gastos) {
  console.log("Guardando gastos en Firebase...", gastos);
  try {
    // Limpiar colección existente
    await clearCollection("gastos");
    
    let count = 0;
    for (const gasto of gastos) {
      await addDoc(collection(db, "gastos"), gasto);
      count++;
    }
    
    console.log(`Guardados ${count} gastos en Firebase`);
    return { success: true, count };
  } catch (error) {
    console.error("Error al guardar gastos en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener gastos desde Firebase
async function getExpensesFromFirebase() {
  console.log("Obteniendo gastos desde Firebase...");
  try {
    const querySnapshot = await getDocs(collection(db, "gastos"));
    const gastos = [];

    querySnapshot.forEach(doc => {
      gastos.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Cargados ${gastos.length} gastos desde Firebase`);
    return gastos;
  } catch (error) {
    console.error("Error al cargar gastos desde Firebase:", error);
    return [];
  }
}

// ===== FUNCIONES PARA CAPITAL Y GANANCIAS =====

// Función para guardar capital en Firebase
async function saveCapitalToFirebase(capital) {
  console.log("Guardando capital en Firebase...", capital);
  try {
    // Usar un documento con ID fijo para capital
    await setDoc(doc(db, "configuracion", "capital"), capital);
    console.log("Capital guardado en Firebase");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar capital en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener capital desde Firebase
async function getCapitalFromFirebase() {
  console.log("Obteniendo capital desde Firebase...");
  try {
    const docRef = doc(db, "configuracion", "capital");
    const docSnap = await getDocs(docRef);
    
    if (docSnap.exists()) {
      console.log("Capital cargado desde Firebase");
      return docSnap.data();
    } else {
      console.log("No se encontró el documento de capital en Firebase");
      return null;
    }
  } catch (error) {
    console.error("Error al cargar capital desde Firebase:", error);
    return null;
  }
}

// Función para guardar ganancias en Firebase
async function saveProfitsToFirebase(ganancias) {
  console.log("Guardando ganancias en Firebase...", ganancias);
  try {
    // Usar un documento con ID fijo para ganancias
    await setDoc(doc(db, "configuracion", "ganancias"), { valor: ganancias });
    console.log("Ganancias guardadas en Firebase");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar ganancias en Firebase:", error);
    return { success: false, error: error.message };
  }
}

// Función para obtener ganancias desde Firebase
async function getProfitsFromFirebase() {
  console.log("Obteniendo ganancias desde Firebase...");
  try {
    const docRef = doc(db, "configuracion", "ganancias");
    const docSnap = await getDocs(docRef);
    
    if (docSnap.exists()) {
      console.log("Ganancias cargadas desde Firebase");
      return docSnap.data().valor;
    } else {
      console.log("No se encontró el documento de ganancias en Firebase");
      return null;
    }
  } catch (error) {
    console.error("Error al cargar ganancias desde Firebase:", error);
    return null;
  }
}

// ===== FUNCIONES AUXILIARES =====

// Función para limpiar una colección
async function clearCollection(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = [];
    
    querySnapshot.forEach(document => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`Colección ${collectionName} limpiada correctamente`);
  } catch (error) {
    console.error(`Error al limpiar colección ${collectionName}:`, error);
    throw error;
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Estilo para la notificación
  notification.style.position = 'fixed';
  notification.style.bottom = '70px';
  notification.style.right = '20px';
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '1001';
  notification.style.maxWidth = '300px';
  
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#F44336';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#2196F3';
    notification.style.color = 'white';
  }
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

// ===== FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN =====

// Función para sincronizar con Firebase
async function sincronizarConFirebase() {
  console.log("Iniciando sincronización completa con Firebase...");
  showNotification("Sincronizando todos los datos con Firebase...");
  
  try {
    // Obtener datos actuales
    const datos = JSON.parse(localStorage.getItem("tiendaCelulares"));
    
    if (!datos) {
      showNotification("No hay datos para sincronizar", "error");
      return;
    }
    
    // Guardar todos los datos en Firebase
    const promises = [];
    
    // Inventario, clientes y proveedores
    promises.push(saveInventoryToFirebase(datos.inventario));
    promises.push(saveCustomersToFirebase(datos.clientes));
    promises.push(saveProvidersToFirebase(datos.proveedores));
    
    // Facturas y compras
    promises.push(saveInvoicesToFirebase(datos.facturas));
    promises.push(savePurchasesToFirebase(datos.compras));
    
    // Cuentas por cobrar y pagar
    promises.push(saveAccountsReceivableToFirebase(datos.cuentasCobrar));
    promises.push(saveAccountsPayableToFirebase(datos.cuentasPagar));
    
    // Reparaciones
    promises.push(saveRepairsToFirebase(datos.reparaciones));
    promises.push(saveRepairsInProgressToFirebase(datos.reparacionesEnProceso));
    promises.push(saveCompletedRepairsToFirebase(datos.reparacionesTerminadas));
    
    // Ingresos y gastos
    promises.push(saveIncomesToFirebase(datos.ingresos));
    promises.push(saveExpensesToFirebase(datos.gastos));
    
    // Capital y ganancias
    promises.push(saveCapitalToFirebase(datos.capital));
    promises.push(saveProfitsToFirebase(datos.ganancias));
    
    // Esperar a que todas las operaciones terminen
    await Promise.all(promises);
    
    showNotification("¡Todos los datos sincronizados correctamente!", "success");
  } catch (error) {
    console.error("Error al sincronizar con Firebase:", error);
    showNotification("Error al sincronizar: " + error.message, "error");
  }
}

// Función para sincronizar datos específicos con Firebase
async function sincronizarDatosEspecificos(tipo, datos) {
  if (!autoSyncEnabled) return; // No sincronizar si está desactivado
  
  console.log(`Sincronizando ${tipo} con Firebase...`);
  try {
    switch (tipo) {
      case 'inventario':
        await saveInventoryToFirebase(datos);
        break;
      case 'clientes':
        await saveCustomersToFirebase(datos);
        break;
      case 'proveedores':
        await saveProvidersToFirebase(datos);
        break;
      case 'facturas':
        await saveInvoicesToFirebase(datos);
        break;
      case 'compras':
        await savePurchasesToFirebase(datos);
        break;
      case 'cuentasCobrar':
        await saveAccountsReceivableToFirebase(datos);
        break;
      case 'cuentasPagar':
        await saveAccountsPayableToFirebase(datos);
        break;
      case 'reparaciones':
        await saveRepairsToFirebase(datos);
        break;
      case 'reparacionesEnProceso':
        await saveRepairsInProgressToFirebase(datos);
        break;
      case 'reparacionesTerminadas':
        await saveCompletedRepairsToFirebase(datos);
        break;
      case 'ingresos':
        await saveIncomesToFirebase(datos);
        break;
      case 'gastos':
        await saveExpensesToFirebase(datos);
        break;
      case 'capital':
        await saveCapitalToFirebase(datos);
        break;
      case 'ganancias':
        await saveProfitsToFirebase(datos);
        break;
      default:
        console.log(`Tipo de datos desconocido: ${tipo}`);
    }
    console.log(`${tipo} sincronizado correctamente`);
  } catch (error) {
    console.error(`Error al sincronizar ${tipo}:`, error);
  }
}

// ===== MONKEY PATCHING =====

// Agregar evento al botón de sincronización
syncButton.addEventListener('click', sincronizarConFirebase);

// Función para observar cambios en localStorage
function observeLocalStorage() {
  let previousData = localStorage.getItem("tiendaCelulares");
  
  // Verificar cambios cada 2 segundos
  setInterval(() => {
    const currentData = localStorage.getItem("tiendaCelulares");
    if (currentData !== previousData) {
      console.log("Cambios detectados en localStorage");
      previousData = currentData;
      
      if (autoSyncEnabled) {
        const datos = JSON.parse(currentData);
        if (datos) {
          sincronizarConFirebase().catch(error => {
            console.error("Error al sincronizar automáticamente:", error);
          });
        }
      }
    }
  }, 2000);
}

// Monkey patching - Interceptar funciones específicas
console.log("Configurando monkey patching para funciones específicas...");

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM cargado, aplicando monkey patching...");
  
  // Iniciar observador de localStorage
  observeLocalStorage();
  
  // Lista de funciones a interceptar para sincronización automática
  const functionsToIntercept = [
    // Inventario
    { name: 'guardarProducto', dataType: 'inventario' },
    { name: 'actualizarProducto', dataType: 'inventario' },
    { name: 'eliminarProducto', dataType: 'inventario' },
    
    // Clientes
    { name: 'guardarCliente', dataType: 'clientes' },
    { name: 'actualizarCliente', dataType: 'clientes' },
    { name: 'eliminarCliente', dataType: 'clientes' },
    
    // Proveedores
    { name: 'guardarProveedor', dataType: 'proveedores' },
    { name: 'actualizarProveedor', dataType: 'proveedores' },
    { name: 'eliminarProveedor', dataType: 'proveedores' },
    
    // Facturas
    { name: 'finalizarFactura', dataType: 'facturas' },
    { name: 'eliminarFactura', dataType: 'facturas' },
    
    // Compras
    { name: 'finalizarCompra', dataType: 'compras' },
    { name: 'eliminarCompra', dataType: 'compras' },
    
    // Reparaciones
    { name: 'agregarReparacion', dataType: 'reparaciones' },
    { name: 'moverReparacionAProceso', dataType: 'reparaciones' },
    { name: 'moverReparacionATerminada', dataType: 'reparaciones' },
    { name: 'eliminarReparacion', dataType: 'reparaciones' },
    
    // Cuentas por cobrar/pagar
    { name: 'abonarFacturaCredito', dataType: 'cuentasCobrar' },
    { name: 'abonarCompraCredito', dataType: 'cuentasPagar' },
    
    // Ingresos/Gastos
    { name: 'registrarIngreso', dataType: 'ingresos' },
    { name: 'registrarGasto', dataType: 'gastos' },
    
    // Capital
    { name: 'anadirCapital', dataType: 'capital' },
    { name: 'restarCapital', dataType: 'capital' },
    { name: 'anadirGananciasCapital', dataType: 'capital' }
  ];
  
  // Interceptar cada función
  functionsToIntercept.forEach(func => {
    if (typeof window[func.name] === 'function') {
      console.log(`Interceptando función ${func.name}`);
      
      // Guardar referencia a la función original
      const originalFunction = window[func.name];
      
      // Reemplazar con nuestra versión
      window[func.name] = function() {
        // Llamar a la función original primero
        const result = originalFunction.apply(this, arguments);
        
        // Luego sincronizar con Firebase
        if (autoSyncEnabled) {
          setTimeout(() => {
            const datos = JSON.parse(localStorage.getItem("tiendaCelulares"));
            if (datos && datos[func.dataType]) {
              sincronizarDatosEspecificos(func.dataType, datos[func.dataType])
                .catch(error => console.error(`Error al sincronizar ${func.dataType}:`, error));
            }
          }, 100); // Pequeño retraso para asegurar que localStorage esté actualizado
        }
        
        return result;
      };
    }
  });
  
  // Verificar si la función guardarEnLocalStorage existe
  if (typeof window.guardarEnLocalStorage === 'function') {
    console.log("Función guardarEnLocalStorage encontrada, aplicando monkey patch");
    
    // Guardar referencia a la función original
    const originalGuardarEnLocalStorage = window.guardarEnLocalStorage;
    
    // Reemplazar con nuestra versión que también guarda en Firebase
    window.guardarEnLocalStorage = function() {
      // Llamar a la función original primero
      originalGuardarEnLocalStorage.apply(this, arguments);
      
      // Luego guardar en Firebase si está activada la sincronización automática
      if (autoSyncEnabled) {
        console.log("guardarEnLocalStorage interceptado, guardando en Firebase...");
        
        // Obtener datos actuales
        const datos = JSON.parse(localStorage.getItem("tiendaCelulares"));
        
        if (datos) {
          // Sincronizar todos los datos (sin esperar)
          sincronizarConFirebase().catch(error => {
            console.error("Error al sincronizar automáticamente:", error);
          });
        }
      }
    };
    
    console.log("Monkey patch aplicado correctamente");
  } else {
    console.error("ADVERTENCIA: No se encontró la función guardarEnLocalStorage. El guardado automático en Firebase no funcionará completamente.");
    showNotification("Sincronización automática limitada. Use el botón de sincronización manual si es necesario.", "error");
  }
  
  // Cargar datos desde Firebase al inicio
  console.log("Cargando datos iniciales desde Firebase...");
  
  // Verificar si la función cargarDesdeLocalStorage existe y puede ser modificada
  if (typeof window.cargarDesdeLocalStorage === 'function') {
    console.log("Función cargarDesdeLocalStorage encontrada, aplicando monkey patch");
    
    // Guardar referencia a la función original
    const originalCargarDesdeLocalStorage = window.cargarDesdeLocalStorage;
    
    // Reemplazar con nuestra versión que también carga desde Firebase
    window.cargarDesdeLocalStorage = async function() {
      // Llamar a la función original primero
      originalCargarDesdeLocalStorage.apply(this, arguments);
      
      // Luego intentar cargar desde Firebase
      console.log("cargarDesdeLocalStorage interceptado, cargando desde Firebase...");
      
      try {
        // Obtener datos actuales
        const datos = JSON.parse(localStorage.getItem("tiendaCelulares")) || {};
        let datosActualizados = false;
        
        // Cargar inventario desde Firebase
        const firebaseInventario = await getInventoryFromFirebase();
        if (firebaseInventario && firebaseInventario.length > 0) {
          console.log(`Cargados ${firebaseInventario.length} productos desde Firebase`);
          datos.inventario = firebaseInventario;
          datosActualizados = true;
        }
        
        // Cargar clientes desde Firebase
        const firebaseClientes = await getCustomersFromFirebase();
        if (firebaseClientes && firebaseClientes.length > 0) {
          console.log(`Cargados ${firebaseClientes.length} clientes desde Firebase`);
          datos.clientes = firebaseClientes;
          datosActualizados = true;
        }
        
        // Cargar proveedores desde Firebase
        const firebaseProveedores = await getProvidersFromFirebase();
        if (firebaseProveedores && firebaseProveedores.length > 0) {
          console.log(`Cargados ${firebaseProveedores.length} proveedores desde Firebase`);
          datos.proveedores = firebaseProveedores;
          datosActualizados = true;
        }
        
        // Si se actualizaron datos, guardar en localStorage y actualizar interfaz
        if (datosActualizados) {
          localStorage.setItem("tiendaCelulares", JSON.stringify(datos));
          
          // Actualizar la interfaz si es necesario
          if (typeof window.actualizarTablaInventario === 'function') {
            window.actualizarTablaInventario();
          }
          if (typeof window.actualizarTablaClientes === 'function') {
            window.actualizarTablaClientes();
          }
          if (typeof window.actualizarTablaProveedores === 'function') {
            window.actualizarTablaProveedores();
          }
          
          showNotification("Datos cargados desde Firebase", "success");
        }
      } catch (error) {
        console.error("Error al cargar desde Firebase:", error);
      }
    };
    
    console.log("Monkey patch para cargarDesdeLocalStorage aplicado correctamente");
  }
});

// Exportar funciones para uso global
window.sincronizarConFirebase = sincronizarConFirebase;
window.saveInventoryToFirebase = saveInventoryToFirebase;
window.getInventoryFromFirebase = getInventoryFromFirebase;
window.deleteProductFromFirebase = deleteProductFromFirebase;
window.saveCustomersToFirebase = saveCustomersToFirebase;
window.getCustomersFromFirebase = getCustomersFromFirebase;
window.saveProvidersToFirebase = saveProvidersToFirebase;
window.getProvidersFromFirebase = getProvidersFromFirebase;
window.saveInvoicesToFirebase = saveInvoicesToFirebase;
window.getInvoicesFromFirebase = getInvoicesFromFirebase;
window.savePurchasesToFirebase = savePurchasesToFirebase;
window.getPurchasesFromFirebase = getPurchasesFromFirebase;
window.saveAccountsReceivableToFirebase = saveAccountsReceivableToFirebase;
window.getAccountsReceivableFromFirebase = getAccountsReceivableFromFirebase;
window.saveAccountsPayableToFirebase = saveAccountsPayableToFirebase;
window.getAccountsPayableFromFirebase = getAccountsPayableFromFirebase;
window.saveRepairsToFirebase = saveRepairsToFirebase;
window.getRepairsFromFirebase = getRepairsFromFirebase;
window.saveRepairsInProgressToFirebase = saveRepairsInProgressToFirebase;
window.getRepairsInProgressFromFirebase = getRepairsInProgressFromFirebase;
window.saveCompletedRepairsToFirebase = saveCompletedRepairsToFirebase;
window.getCompletedRepairsFromFirebase = getCompletedRepairsFromFirebase;
window.saveIncomesToFirebase = saveIncomesToFirebase;
window.getIncomesFromFirebase = getIncomesFromFirebase;
window.saveExpensesToFirebase = saveExpensesToFirebase;
window.getExpensesFromFirebase = getExpensesFromFirebase;
window.saveCapitalToFirebase = saveCapitalToFirebase;
window.getCapitalFromFirebase = getCapitalFromFirebase;
window.saveProfitsToFirebase = saveProfitsToFirebase;
window.getProfitsFromFirebase = getProfitsFromFirebase;

console.log("Módulo de Firebase cargado correctamente");