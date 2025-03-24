// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKZ6zUWN9Oa3BqvdUOlDwUtMDT18V_V7U",
  authDomain: "tienda-de-celulares-23e65.firebaseapp.com",
  projectId: "tienda-de-celulares-23e65",
  storageBucket: "tienda-de-celulares-23e65.firebasestorage.app",
  messagingSenderId: "90520827298",
  appId: "1:90520827298:web:290fd6d2c677f7364faefb",
  measurementId: "G-SVN61V3YY0",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const db = getFirestore(app)

// Function to save inventory to Firebase
export async function saveInventoryToFirebase(inventario) {
  try {
    // First, get existing products to avoid duplicates
    const existingProducts = await getInventoryFromFirebase()
    const existingCodes = existingProducts.map((p) => p.codigo)

    let successCount = 0
    let updateCount = 0

    for (const producto of inventario) {
      if (existingCodes.includes(producto.codigo)) {
        // Update existing product
        const productRef = query(collection(db, "inventario"), where("codigo", "==", producto.codigo))
        const querySnapshot = await getDocs(productRef)

        if (!querySnapshot.empty) {
          const docRef = doc(db, "inventario", querySnapshot.docs[0].id)
          await updateDoc(docRef, producto)
          updateCount++
        }
      } else {
        // Add new product
        await addDoc(collection(db, "inventario"), producto)
        successCount++
      }
    }

    console.log(`Guardado en Firebase: ${successCount} productos nuevos, ${updateCount} actualizados`)
    return { success: true, added: successCount, updated: updateCount }
  } catch (error) {
    console.error("Error al guardar en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Function to get inventory from Firebase
export async function getInventoryFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, "inventario"))
    const productos = []

    querySnapshot.forEach((doc) => {
      productos.push({ id: doc.id, ...doc.data() })
    })

    console.log(`Cargados ${productos.length} productos desde Firebase`)
    return productos
  } catch (error) {
    console.error("Error al cargar desde Firebase:", error)
    return []
  }
}

// Function to delete a product from Firebase
export async function deleteProductFromFirebase(codigo) {
  try {
    const productRef = query(collection(db, "inventario"), where("codigo", "==", codigo))
    const querySnapshot = await getDocs(productRef)

    if (!querySnapshot.empty) {
      const docRef = doc(db, "inventario", querySnapshot.docs[0].id)
      await deleteDoc(docRef)
      return { success: true }
    } else {
      return { success: false, error: "Producto no encontrado" }
    }
  } catch (error) {
    console.error("Error al eliminar de Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Function to save customers to Firebase
export async function saveCustomersToFirebase(clientes) {
  try {
    // Similar implementation as inventory
    const existingCustomers = await getCustomersFromFirebase()
    const existingCodes = existingCustomers.map((c) => c.codigo)

    let successCount = 0
    let updateCount = 0

    for (const cliente of clientes) {
      if (existingCodes.includes(cliente.codigo)) {
        // Update existing customer
        const customerRef = query(collection(db, "clientes"), where("codigo", "==", cliente.codigo))
        const querySnapshot = await getDocs(customerRef)

        if (!querySnapshot.empty) {
          const docRef = doc(db, "clientes", querySnapshot.docs[0].id)
          await updateDoc(docRef, cliente)
          updateCount++
        }
      } else {
        // Add new customer
        await addDoc(collection(db, "clientes"), cliente)
        successCount++
      }
    }

    return { success: true, added: successCount, updated: updateCount }
  } catch (error) {
    console.error("Error al guardar clientes en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Function to get customers from Firebase
export async function getCustomersFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, "clientes"))
    const clientes = []

    querySnapshot.forEach((doc) => {
      clientes.push({ id: doc.id, ...doc.data() })
    })

    return clientes
  } catch (error) {
    console.error("Error al cargar clientes desde Firebase:", error)
    return []
  }
}

// Function to save suppliers to Firebase
export async function suppliersToFirebase(proveedores) {
  try {
    // Similar implementation as inventory
    const existingSuppliers = await getSuppliersFromFirebase()
    const existingCodes = existingSuppliers.map((p) => p.codigo)

    let successCount = 0
    let updateCount = 0

    for (const proveedor of proveedores) {
      if (existingCodes.includes(proveedor.codigo)) {
        // Update existing supplier
        const supplierRef = query(collection(db, "proveedores"), where("codigo", "==", proveedor.codigo))
        const querySnapshot = await getDocs(supplierRef)

        if (!querySnapshot.empty) {
          const docRef = doc(db, "proveedores", querySnapshot.docs[0].id)
          await updateDoc(docRef, proveedor)
          updateCount++
        }
      } else {
        // Add new supplier
        await addDoc(collection(db, "proveedores"), proveedor)
        successCount++
      }
    }

    return { success: true, added: successCount, updated: updateCount }
  } catch (error) {
    console.error("Error al guardar proveedores en Firebase:", error)
    return { success: false, error: error.message }
  }
}

// Function to get suppliers from Firebase
export async function getSuppliersFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, "proveedores"))
    const proveedores = []

    querySnapshot.forEach((doc) => {
      proveedores.push({ id: doc.id, ...doc.data() })
    })

    return proveedores
  } catch (error) {
    console.error("Error al cargar proveedores desde Firebase:", error)
    return []
  }
}

// Export the Firebase app and database for use in other files
export { app, db }

