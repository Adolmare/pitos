# Pitos Pizza - Arquitectura Profesional V2

Este proyecto ha sido actualizado para cumplir con estándares profesionales de seguridad, validación y escalabilidad.

## 🚀 Nuevas Características

### 1. Seguridad (JWT)
- Implementación de **JSON Web Tokens (JWT)** para autenticación.
- Roles de usuario: `admin`, `cocina`, `repartidor`.
- Middleware de protección de rutas (`authenticateToken`, `authorizeRole`).
- Hash de contraseñas usando `bcrypt`.

### 2. Validación de Datos (Zod)
- Validación estricta en el servidor para evitar datos corruptos.
- Recálculo de precios en el servidor (el frontend no decide los precios).

### 3. Sistema de Gestión de Productos (CMS)
- Nueva ruta protegida `/productos` para administrar el menú.
- Los cambios en el CMS se reflejan instantáneamente en la web pública.

### 4. Logging de Errores
- Sistema avanzado de logs usando `Winston`.
- Archivos generados: `error.log` (críticos) y `combined.log` (todo el tráfico).

### 5. flujo de Repartidores Mejorado
- OCR de recibos con verificación manual de dos pasos (Escanear -> Verificar -> Guardar).
- Minimiza errores de lectura automática.

## 🔑 Credenciales por defecto
| Rol        | Usuario    | Contraseña   |
|------------|------------|--------------|
| Admin      | admin      | admin123     |
| Cocina     | cocina     | cocina123    |
| Repartidor | reparto    | reparto123   |

## 🛠 Instalación y Ejecución

### Backend
```bash
cd pitos-backend
npm install
node server.js
```
El servidor corre en `http://localhost:3000`.

### Frontend
```bash
cd pitos-web
npm install
npm run dev
```
La web corre en `http://localhost:5173`.

## 📂 Estructura de Carpetas Importante
- `/pitos-backend/server.js`: Núcleo de la API.
- `/pitos-backend/uploads/`: Imágenes de recibos.
- `/pitos-web/src/context/AuthContext.jsx`: Manejo de sesión.
- `/pitos-web/src/pages/Products.jsx`: Panel de administración.
