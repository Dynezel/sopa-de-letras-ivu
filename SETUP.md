# 🎮 WordHunt — Guía de instalación

## Lo que necesitás
- Node.js instalado (https://nodejs.org) — descargá la versión LTS
- Una cuenta en Firebase (https://firebase.google.com) — es gratis
- Una cuenta en Vercel (https://vercel.com) — es gratis

---

## PASO 1 — Configurar Firebase

1. Entrá a https://console.firebase.google.com
2. Hacé click en **"Agregar proyecto"**
3. Poné un nombre (ej: `wordhunt`) y seguí los pasos
4. En el menú lateral, hacé click en **"Realtime Database"**
5. Hacé click en **"Crear base de datos"**
6. Elegí la región más cercana (ej: `us-central1`)
7. Arrancá en **modo test** (para desarrollo) → Siguiente

### Configurar reglas de seguridad
En la pestaña **Reglas** de Realtime Database, pegá esto y hacé click en **Publicar**:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> ⚠️ Esto es suficiente para el juego. Si querés más seguridad después, se puede mejorar.

### Obtener las credenciales
1. Hacé click en el ⚙️ (configuración) → **Configuración del proyecto**
2. Bajá hasta **"Tus apps"** → hacé click en **"</>"** (agregar app web)
3. Registrá la app (poné cualquier nombre)
4. Copiá el objeto `firebaseConfig` que te muestra

---

## PASO 2 — Configurar el código

1. Abrí el archivo **`src/firebase.js`**
2. Reemplazá los valores con los que copiaste de Firebase:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← el tuyo
  authDomain: "wordhunt-abc.firebaseapp.com",
  databaseURL: "https://wordhunt-abc-default-rtdb.firebaseio.com",
  projectId: "wordhunt-abc",
  storageBucket: "wordhunt-abc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

3. Si querés cambiar las palabras, abrí **`src/App.jsx`** y editá la línea:
```js
const WORDS = ["GATO", "PERRO", "ROJO", ...];
```

4. Si querés cambiar la contraseña del admin, buscá:
```js
const ADMIN_PASSWORD = "admin123";
```

---

## PASO 3 — Probar localmente (opcional)

Abrí una terminal en la carpeta del proyecto y ejecutá:
```bash
npm install
npm run dev
```
Abrí http://localhost:5173 en el navegador.

---

## PASO 4 — Subir a Vercel

### Opción A — Desde GitHub (recomendado)
1. Subí la carpeta del proyecto a un repositorio de GitHub
2. Entrá a https://vercel.com → **"Add New Project"**
3. Importá el repositorio
4. Vercel detecta Vite automáticamente → hacé click en **Deploy**
5. En ~1 minuto tenés la URL para compartir 🎉

### Opción B — Desde la terminal
```bash
npm install -g vercel
vercel
```
Seguí los pasos que te pide y te da la URL.

---

## ✅ Listo

Una vez desplegado, todos los jugadores entran a la misma URL.
- El **admin** abre ⚙️, ingresa la contraseña (`admin123`) y controla el juego
- El botón **🔀 MEZCLAR** regenera la sopa en tiempo real para todos
- Todos ven en tiempo real quién encuentra cada palabra primero

---

## 🔑 Contraseña admin por defecto
```
admin123
```
Cambiala en `src/App.jsx` antes de publicar.
