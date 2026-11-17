# Arquitectura de AulaSmart Cloud

## Estado actual comprobado en el código
- React + Vite: demo estática publicada mediante GitHub Actions en GitHub Pages.
- Datos de demostración: localStorage del navegador.
- API independiente: Express, JWT, validación Zod y PostgreSQL; aún no integrada con la demo.
- La landing pública es una página introductoria, **no** un control de acceso seguro.

## Arquitectura AWS propuesta (no desplegada)
Navegador → dominio HTTPS → frontend estático; navegador → API Node.js en EC2 detrás de un Application Load Balancer → RDS PostgreSQL en subred privada. Seguridad: VPC, grupos de seguridad, IAM, CloudWatch y gestión de secretos. S3 puede servir archivos estáticos.

**Validación obligatoria:** comprobar qué servicios permite AWS Academy y documentar con capturas los recursos realmente implementados. No presentar el diagrama propuesto como despliegue ejecutado.

## Flujo CI/CD
- `ci.yml`: checkout → Node 22 → npm ci → npm run build → comprobación de sintaxis del servidor. Se ejecuta en PR y push a main.
- `deploy.yml`: checkout → Node 22 → npm ci → build de Vite → subir artefacto dist → publicar GitHub Pages.
- `CUSTOM_DOMAIN`: variable de repositorio opcional que hace que Vite utilice base `/`. El DNS y el dominio se configuran aparte en GitHub Pages.
