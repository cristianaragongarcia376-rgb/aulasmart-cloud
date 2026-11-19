<div align="center">🎓 AulaSmart Cloud
Plataforma web de gestión académica para instituciones educativas
Proyecto académico · Buenas Prácticas de Desarrollo de Software · Universidad de la Costa · 2026

🌐 Abrir AulaSmart Cloud · 💻 Repositorio · ⚙️ GitHub Actions · 🔀 Pull Requests
</div>Estado del proyecto (18 de noviembre de 2026): frontend demostrativo React publicado en GitHub Pages bajo el dominio personalizado aulasmartcloud.tech. El dashboard utiliza datos ficticios almacenados en localStorage. El backend Express/PostgreSQL está incluido como base técnica independiente y no conectado a la interfaz; la infraestructura AWS se plantea como evolución y no debe declararse desplegada sin evidencias verificables.

1. Descripción y objetivo
AulaSmart Cloud es un prototipo de plataforma SaaS educativa para centralizar la consulta y administración de información académica desde una interfaz web. Su propósito es mostrar cómo una institución puede gestionar estudiantes, docentes, cursos, matrículas, pagos e indicadores desde un mismo panel. La versión pública es una demostración académica, no un servicio multiinstitución listo para producción.
Funcionalidades del frontend demostrativo
- Landing page: presentación de la plataforma antes de entrar al entorno de demostración.
- Dashboard: indicadores, gráficos y actividad ilustrativa.
- Módulos de gestión: estudiantes, docentes, cursos, matrículas y pagos con operaciones CRUD de la demo.
- Reportes: visualizaciones y exportación CSV de información de demostración.
- Interfaz: navegación lateral, búsqueda, filtros, diseño adaptable y controles visuales.
- Persistencia: almacenamiento local del navegador mediante localStorage y datos ficticios precargados.
Aviso de seguridad: el botón «Explorar demostración» no autentica al usuario. No ingresar información personal real, datos financieros, calificaciones reales ni contraseñas en el dashboard público. No hay procesamiento real de pagos.
2. Tecnologías
Capa	Tecnologías	Uso actual
Interfaz	React 18, JavaScript JSX, Vite 5	Frontend de demostración
Diseño e iconos	CSS, Lucide React	Presentación visual
Gráficos	Recharts 2	Estadísticas ilustrativas
Persistencia de la demo	localStorage	Datos locales al navegador
Backend independiente	Node.js, Express, JWT, Zod, bcryptjs	API preparada, no conectada al frontend
Datos del backend	PostgreSQL (pg)	Requiere instancia y configuración propia
Control de versiones	Git y GitHub	Ramas, commits y Pull Requests
Integración / entrega	GitHub Actions, GitHub Pages	CI y despliegue del frontend
Dominio	aulasmartcloud.tech	DNS de GitHub Pages y HTTPS


3. Getting Started — instalación local
Requisitos: Git, Node.js 20 o superior y npm. Para reproducir el entorno de CI/CD se utiliza Node.js 22. No se requiere PostgreSQL para utilizar la demostración React.
# Clonar el repositorio
git clone https://github.com/cristianaragongarcia376-rgb/aulasmart-cloud.git
cd aulasmart-cloud

# Instalar dependencias del frontend
npm ci

# Iniciar servidor de desarrollo
npm run dev
Abrir la dirección que muestre Vite, habitualmente http://localhost:5173/; si ese puerto está ocupado puede aparecer 5174.
Compilación de producción (build)
npm run build
npm run preview
- npm run build genera el contenido estático de producción en dist/.
- npm run preview permite verificar localmente la compilación.
- dist/ es un artefacto generado: no debe añadirse manualmente al repositorio si está ignorado por Git.
Comandos disponibles
Comando	Función
npm ci	Instala las dependencias fijadas en package-lock.json
npm run dev	Inicia Vite para desarrollo
npm run build	Genera el frontend de producción
npm run preview	Previsualiza la compilación generada


4. Estructura del proyecto
aulasmart-cloud/
├── .github/
│   └── workflows/
│       ├── ci.yml                # Validaciones automáticas en GitHub
│       └── deploy.yml            # Publicación en GitHub Pages
├── docs/                         # Documentación y evidencias (según la versión)
├── server/
│   ├── .env.example              # Variables requeridas por la API
│   ├── package.json
│   ├── sql/schema.sql            # Esquema relacional PostgreSQL
│   └── src/
│       ├── index.js              # Servidor Express y rutas API
│       └── seed-admin.js         # Alta inicial de institución/admin
├── src/
│   ├── main.jsx                  # Componente App, landing y pantallas de la demo
│   └── style.css                 # Estilos de la interfaz
├── .gitignore
├── index.html                   # Documento HTML raíz
├── package.json                 # Dependencias y scripts del frontend
├── package-lock.json
├── vite.config.js               # Configuración del build y ruta base
└── README.md                    # Esta guía
¿Dónde está cada parte de React?
- index.html contiene el elemento #root donde se monta la interfaz.
- src/main.jsx importa React, renderiza PublicLanding mediante createRoot(...) y contiene el componente principal App del dashboard. La interfaz todavía está concentrada en este archivo; dividirla por componentes es una mejora pendiente.
- src/style.css controla el aspecto de la landing, panel, tablas y formularios.
- vite.config.js configura el plugin de React y la ruta base (base) según el tipo de despliegue.
- server/src/index.js implementa una API independiente; no es el componente principal de React.
5. Flujo de funcionamiento
Visitante → https://aulasmartcloud.tech
         → Landing pública (PublicLanding)
         → «Explorar demostración»
         → Dashboard React (App)
         → Datos ficticios / localStorage del navegador
Los datos que se crean o modifican en la demo son locales al navegador. No se comparten entre dispositivos ni se almacenan en PostgreSQL. La landing es una pantalla de presentación y no sustituye un login con autorización en servidor.
6. Backend Express/PostgreSQL (opcional; independiente)
El código del servidor incorpora rutas de login con JWT, operaciones para recursos académicos, validación con Zod, hashing de contraseñas, filtros por institución, límites de peticiones y cabeceras de seguridad. No forma parte del sitio que publica GitHub Pages.
Requisitos y configuración local
Se requiere PostgreSQL y Node.js. Desde la raíz del repositorio:
cd server
npm install
cp .env.example .env
Completar server/.env con valores reales de desarrollo:
PORT=4000
DATABASE_URL=postgresql://USUARIO:CLAVE@localhost:5432/aulasmart
JWT_SECRET=CAMBIA_ESTE_VALOR_POR_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
La base de datos aulasmart debe existir antes de cargar el esquema. Por ejemplo, con PostgreSQL instalado y sus credenciales configuradas:
createdb aulasmart
psql -d aulasmart -f sql/schema.sql
node src/seed-admin.js "Administrador" admin@ejemplo.com "UnaClaveSeguraParaPruebas123" "Colegio Horizonte"
npm run dev
El backend escucha, por defecto, en http://localhost:4000. El endpoint GET /api/health verifica la conexión a la base de datos. El login se realiza en POST /api/auth/login; los recursos students, teachers, courses, enrollments y payments requieren JWT para sus operaciones protegidas.

No publicar .env, claves, tokens ni datos académicos reales. Para llevar esta API a producción faltan integración frontend/API, pruebas automatizadas de seguridad, despliegue de servidor y base de datos, gestión de secretos y validación del aislamiento entre instituciones.
7. CI/CD — GitHub Actions
Los workflows se encuentran en .github/workflows/.
Integración continua: ci.yml
Se activa en eventos configurados sobre la rama principal (master) y puede ejecutarse en Pull Requests. El job de verificación utiliza un ejecutor Linux, descarga el repositorio (actions/checkout), configura Node.js 22 (actions/setup-node), instala dependencias con npm ci, ejecuta npm run build y verifica la sintaxis principal del backend con node --check server/src/index.js.

Qué comprueba: que la aplicación compila y que el archivo inspeccionado del servidor tiene sintaxis JavaScript válida. Qué no comprueba: pruebas funcionales end-to-end, persistencia real, seguridad completa ni infraestructura AWS.
Entrega continua: deploy.yml
En un push a master, GitHub Actions construye el frontend y lo publica en GitHub Pages mediante dos jobs:
1. build (Compilar React): checkout, Node.js, npm ci, npm run build, configuración de Pages y subida del contenido de dist/ como artefacto.
2. deploy (Publicar AulaSmart Cloud): depende de build mediante needs: build y publica el artefacto utilizando actions/deploy-pages en el entorno github-pages.
Campos importantes de YAML para explicar en la sustentación:
Campo	Función
name	Nombre visible del flujo o job
on	Eventos que activan el workflow
permissions	Permisos mínimos del token de Actions
jobs	Trabajos automáticos que ejecuta GitHub
runs-on	Sistema operativo del ejecutor
steps	Secuencia de acciones/comandos de cada job
uses	Acción reutilizable de GitHub
run	Comando que se ejecuta en la terminal del job
env	Variables disponibles en un paso
needs	Job que debe concluir antes de continuar
environment	Entorno de publicación de GitHub Pages


Evidencia histórica: el flujo de despliegue mostró ambos jobs exitosos en GitHub Actions. Las nuevas versiones deben volver a verificarse en la pestaña Actions.
8. Dominio personalizado, DNS y HTTPS
Sitio público: https://aulasmartcloud.tech

El dominio se registró mediante una oferta educativa de GitHub Student Developer Pack y se administra en Namify/.TECH Domains. GitHub Pages sirve el frontend estático.
Registros DNS configurados
Tipo	Host	Destino
A	@	185.199.108.153
A	@	185.199.109.153
A	@	185.199.110.153
A	@	185.199.111.153
CNAME	www	cristianaragongarcia376-rgb.github.io


La configuración se gestiona en GitHub → Settings → Pages → Custom domain. La opción Enforce HTTPS se mostró habilitada en la evidencia del despliegue. DNS y certificados pueden tardar en propagarse después de cambios.
Vite y rutas de activos
En GitHub Pages bajo la ruta del repositorio, Vite puede necesitar base: '/aulasmart-cloud/'. Con dominio personalizado propio la aplicación se sirve desde la raíz y debe utilizar base: '/'. La configuración reciente de despliegue pasa:
env:
  GITHUB_PAGES: 'true'
  CUSTOM_DOMAIN: 'aulasmartcloud.tech'
La prueba local equivalente en Git Bash es:
GITHUB_PAGES=true CUSTOM_DOMAIN=aulasmartcloud.tech npm run build
grep -E 'src=|href=' dist/index.html
En la salida de dist/index.html los assets deben tener rutas como /assets/index-xxxx.js y /assets/index-xxxx.css. Una compilación local con este resultado fue comprobada antes de crear el PR de dominio.
9. Arquitectura — actual y propuesta AWS Academy
Arquitectura implementada y demostrada
Usuario / navegador
        ↓ HTTPS
Dominio: aulasmartcloud.tech (DNS externo)
        ↓
GitHub Pages → Frontend estático React + Vite
        ↓
localStorage en el navegador (datos ficticios)

GitHub (rama master) → Actions CI → Actions CD → GitHub Pages
Arquitectura AWS propuesta (NO verificada como desplegada)
Usuarios → DNS/HTTPS → Frontend React
                          ↓
                API Node.js / Express
              (EC2 + Application Load Balancer)
                          ↓
              PostgreSQL (Amazon RDS)

VPC + subredes + grupos de seguridad + IAM
CloudWatch para monitoreo; S3 para recursos/respaldos cuando corresponda
Esta propuesta deberá adaptarse a los servicios y límites realmente habilitados por AWS Academy. Es necesario documentar cuentas, configuración, controles de acceso, red, costos estimados y capturas del entorno solo cuando estén efectivamente implementados. El sitio visible actualmente en GitHub Pages no demuestra un despliegue en AWS.
10. Control de versiones y Pull Requests
Repositorio: cristianaragongarcia376-rgb/aulasmart-cloud. Rama principal: master.

El desarrollo utiliza ramas como feature/mejoras-interfaz, feature/configurar-ci, feature/despliegue-automatico y fix/dominio-personalizado. Los PR permiten integrar mejoras de manera trazable. Ejemplos de commits: feat: ..., fix: ..., ci: ..., docs: ....

Flujo de colaboración recomendado:
git switch master
git pull origin master
git switch -c docs/readme-tecnico
# Modificar documentación y comprobar los cambios
git add README.md
git commit -m "docs: documentar arquitectura y despliegue de AulaSmart Cloud"
git push -u origin docs/readme-tecnico
# Crear un Pull Request hacia master desde GitHub
Evidencia de la rúbrica: las capturas previas muestran cuatro Pull Requests creados y workflows ejecutados. La aprobación de PR por otra persona requiere un revisor real; el autor no puede acreditar una revisión independiente de su propio trabajo. En un proyecto individual, consultar la excepción correspondiente con el profesor.
11. Evidencias para la entrega
En la sustentación mostrar capturas reales (o almacenarlas en docs/evidencias/ si se añaden al repositorio):
Evidencia	Qué debe mostrar
Landing pública	URL aulasmartcloud.tech y pantalla de bienvenida
Panel administrativo	Dashboard y módulos con datos ficticios
Historial Git	Ramas, commits y descripciones
Pull Requests	PR, revisión, checks y estado de fusión
CI	Jobs de ci.yml aprobados
CD	Jobs build y deploy aprobados
Dominio y HTTPS	Configuración GitHub Pages y registros DNS de Namify
React	src/main.jsx, src/style.css, vite.config.js y index.html
AWS Academy	Capturas solo de infraestructura realmente creada


El README no sustituye el documento académico con normas APA 7, que debe incluir la arquitectura actualizada y las referencias correspondientes.
12. Limitaciones y trabajo pendiente
- No hay login ni autorización real en el frontend público.
- Los datos de la demostración no se sincronizan ni tienen persistencia de servidor.
- El backend Express/PostgreSQL no está integrado ni publicado en GitHub Pages.
- Falta verificar e implementar una infraestructura real en AWS Academy, si se exige desplegarla.
- Faltan pruebas automatizadas de comportamiento, seguridad y rendimiento.
- Se recomienda dividir src/main.jsx en componentes, vistas y servicios conforme crezca el proyecto.
- Las dependencias requieren revisión periódica de seguridad (npm audit) y actualizaciones comprobadas, evitando cambios forzados sin pruebas.
13. Autoría y uso académico
Proyecto: AulaSmart Cloud
Asignatura: Buenas Prácticas de Desarrollo de Software
Institución: Universidad de la Costa (CUC)
Año: 2026
Repositorio: https://github.com/cristianaragongarcia376-rgb/aulasmart-cloud
Desarrollador: Cristian Andrés Aragón García

Este prototipo se presenta con fines académicos y utiliza datos de demostración.
