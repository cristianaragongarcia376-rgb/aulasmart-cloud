# 🎓 AulaSmart Cloud

**Plataforma de gestión académica para pequeñas instituciones educativas.** Proyecto académico de Buenas Prácticas de Desarrollo de Software (Universidad de la Costa, 2026).

## ✨ Funcionalidades de la demostración

- Dashboard con indicadores, gráficos y actividad ilustrativa.
- CRUD (crear, consultar, editar y eliminar) de estudiantes, docentes, cursos, matrículas y pagos.
- Búsqueda instantánea, estados, validaciones básicas y exportación CSV.
- Interfaz responsive, navegación lateral y tema claro/oscuro experimental.
- Persistencia local en `localStorage`, sin servidor ni cuenta, ideal para GitHub Pages.
- Datos ficticios precargados; opción para restablecerlos.

> **IMPORTANTE:** GitHub Pages publica únicamente la **demostración frontend**. Los datos guardados en el navegador no se sincronizan entre usuarios, no están cifrados y no deben incluir información personal real. Los gráficos de crecimiento son ilustrativos. No se implementan aquí pagos electrónicos, asistencia, autenticación real ni despliegue AWS.

## 🚀 Ejecutar la interfaz localmente

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Para compilar:

```bash
npm run build
npm run preview
```

## 🌐 Publicar en GitHub Pages

1. Crea un repositorio llamado, por ejemplo, `aulasmart-cloud`.
2. Sube **todo el contenido de esta carpeta** a la rama `main` (incluida `.github/workflows/deploy.yml`).
3. En GitHub abre **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. El workflow construirá y publicará el frontend automáticamente después de cada `push` a `main`.
5. La dirección será `https://TU-USUARIO.github.io/aulasmart-cloud/` si el repositorio tiene ese nombre.

El archivo `vite.config.js` calcula automáticamente la ruta base usando el nombre del repositorio. Para un dominio propio, añade el dominio en Settings → Pages y configura el DNS; si el sitio se publica en la raíz de un dominio propio, ajusta la base de Vite a `/` y vuelve a desplegar.

## 🗂️ Estructura

```text
aulasmart-cloud/
├── src/                   # React, panel y estilos
├── server/                # API Express/PostgreSQL independiente (base técnica)
│   ├── sql/schema.sql
│   ├── src/index.js
│   └── src/seed-admin.js
├── .github/workflows/     # Despliegue automático GitHub Pages
├── index.html
├── vite.config.js
└── README.md
```

## 🧩 Backend (base independiente, no conectado a la demo)

Se incluye una **API inicial** con Express, PostgreSQL, JWT, validación Zod, control de acceso y filtros por institución. **No está integrada con la interfaz de demostración**: esa integración, la administración completa de usuarios, el control granular docente/estudiante y las pruebas de seguridad son trabajo pendiente para producción.

Requisitos: PostgreSQL y Node.js 20+.

```bash
cd server
npm install
cp .env.example .env
# Edita .env con tu conexión y JWT_SECRET
createdb aulasmart
psql -d aulasmart -f sql/schema.sql
node src/seed-admin.js "Administrador" admin@ejemplo.com "clave-segura-de-12-o-mas" "Colegio Horizonte"
npm run dev
```

Ejemplo de login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@ejemplo.com","password":"clave-segura-de-12-o-mas"}'
```

La API escucha en `http://localhost:4000`. Rutas: `/api/health`, `/api/auth/login`, `/api/me`, `/api/students`, `/api/teachers`, `/api/courses`, `/api/enrollments`, `/api/payments`. Para modificar datos se necesita JWT de administrador. Cada consulta filtra por `institution_id`. Para producción, revisar aislamiento multiinquilino, RLS en PostgreSQL, transacciones de auditoría, CORS, backups, pruebas automatizadas y gestión de secretos.

## ☁️ Arquitectura AWS propuesta

La propuesta original considera VPC, Application Load Balancer, EC2 para Node.js, RDS, S3, CloudWatch y opcionalmente Route 53. **No hay infraestructura AWS desplegada** en este repositorio. El frontend estático puede publicarse sin costo de infraestructura propia en GitHub Pages, sujeto a las condiciones de GitHub.

## 🔐 Buenas prácticas y límites

- Nunca publiques `.env`, claves JWT, credenciales o datos personales.
- No uses GitHub Pages para hospedar la API, la base de datos o secretos.
- La API incluye validación de datos, hashing de contraseñas, límites de solicitudes, cabeceras de seguridad y autorización básica.
- Antes de producción: autenticación completa, permisos por recurso, políticas de privacidad, pruebas de aislamiento por institución, backups y monitoreo.

## 📚 Créditos

Basado en la propuesta **AulaSmart Cloud** de Cristian Andrés Aragón García, asignatura Buenas Prácticas de Desarrollo de Software, Universidad de la Costa (CUC), 2026.
