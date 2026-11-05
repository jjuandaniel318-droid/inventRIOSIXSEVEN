import { db, auth } from "./firebase.js";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);
const money = (val) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val || 0);
let products = [];
let unsubscribe = null;

// --- INVENTARIO ---
function render() {
  const searchTerm = $("search").value.toLowerCase();
  const filtered = products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(searchTerm));
  
  $("totalProducts").textContent = products.length;
  $("totalUnits").textContent = products.reduce((acc, p) => acc + Number(p.quantity), 0);
  $("totalValue").textContent = money(products.reduce((acc, p) => acc + (p.price * p.quantity), 0));

  if (!filtered.length) {
    $("productRows").innerHTML = `<tr><td colspan="5" class="empty">No hay productos registrados.</td></tr>`;
    return;
  }

  $("productRows").innerHTML = filtered.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.quantity}</td>
      <td class="actions">
        <button class="small-button" onclick="window.editProduct('${p.id}')">Editar</button>
        <button class="small-button delete" onclick="window.deleteProduct('${p.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

window.editProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  $("productId").value = p.id; $("name").value = p.name; $("category").value = p.category;
  $("price").value = p.price; $("quantity").value = p.quantity;
  $("formTitle").textContent = "Editar producto"; $("saveButton").textContent = "Guardar cambios";
  $("cancelEdit").classList.remove("hidden");
  window.scrollTo(0, 0);
};

window.deleteProduct = async (id) => {
  if (confirm("¿Eliminar producto?")) {
    await deleteDoc(doc(db, "productos", id));
  }
};

$("cancelEdit").onclick = () => {
  $("productForm").reset(); $("productId").value = ""; $("formTitle").textContent = "Agregar producto";
  $("saveButton").textContent = "Guardar producto"; $("cancelEdit").classList.add("hidden");
};

$("productForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    name: $("name").value, category: $("category").value,
    price: Number($("price").value), quantity: Number($("quantity").value)
  };
  const id = $("productId").value;
  if (id) await updateDoc(doc(db, "productos", id), data);
  else await addDoc(collection(db, "productos"), data);
  
  $("cancelEdit").click();
};

$("search").oninput = render;

// --- AUTENTICACIÓN ---
const setAuthMsg = (msg, isError = true) => {
  $("loginMessage").textContent = msg;
  $("loginMessage").style.color = isError ? "#b53b3b" : "#167449";
};

// Cambiar entre pantallas
$("goToRegister").onclick = (e) => { e.preventDefault(); $("loginForm").style.display = "none"; $("resetForm").style.display = "none"; $("registerForm").style.display = "flex"; setAuthMsg(""); };
$("goToReset").onclick = (e) => { e.preventDefault(); $("loginForm").style.display = "none"; $("registerForm").style.display = "none"; $("resetForm").style.display = "flex"; setAuthMsg(""); };
$("goToLoginFromRegister").onclick = (e) => { e.preventDefault(); $("registerForm").style.display = "none"; $("loginForm").style.display = "flex"; setAuthMsg(""); };
$("goToLoginFromReset").onclick = (e) => { e.preventDefault(); $("resetForm").style.display = "none"; $("loginForm").style.display = "flex"; setAuthMsg(""); };

// Login
$("loginForm").onsubmit = async (e) => {
  e.preventDefault(); setAuthMsg("");
  try { await signInWithEmailAndPassword(auth, $("loginEmail").value, $("loginPassword").value); }
  catch (err) { setAuthMsg("Error: " + err.message); }
};

// Registro
$("registerForm").onsubmit = async (e) => {
  e.preventDefault(); setAuthMsg("");
  if ($("registerPassword").value !== $("registerPassword2").value) return setAuthMsg("Las contraseñas no coinciden.");
  try { await createUserWithEmailAndPassword(auth, $("registerEmail").value, $("registerPassword").value); }
  catch (err) { setAuthMsg("Error: " + err.message); }
};

// Recuperar
$("resetForm").onsubmit = async (e) => {
  e.preventDefault(); setAuthMsg("");
  try { await sendPasswordResetEmail(auth, $("resetEmail").value); setAuthMsg("Correo enviado. Revisa tu bandeja.", false); }
  catch (err) { setAuthMsg("Error: " + err.message); }
};

// Google
$("googleBtn").onclick = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (err) { setAuthMsg("Error: " + err.message); }
};

$("logoutBtn").onclick = () => signOut(auth);

// El guardián de sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    $("loginScreen").style.display = "none";
    $("appContent").style.display = "block";
    
    if (!unsubscribe) {
      unsubscribe = onSnapshot(query(collection(db, "productos"), orderBy("name")), (snap) => {
        products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render();
      });
    }
  } else {
    $("loginScreen").style.display = "flex";
    $("appContent").style.display = "none";
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    products = []; render();
  }
});