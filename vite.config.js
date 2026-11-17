import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Con dominio propio, GitHub Pages sirve el sitio desde la raíz.
const customDomain = Boolean(process.env.CUSTOM_DOMAIN);
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'aulasmart-cloud';
export default defineConfig({plugins:[react()],base:process.env.GITHUB_PAGES === 'true' && !customDomain ? `/${repo}/` : '/'});
