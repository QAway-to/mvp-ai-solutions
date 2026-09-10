import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Статическая сборка лендинга. Форма заявки живёт не здесь, а в server.mjs:
// токен бота не должен попадать в клиентский бандл.
export default defineConfig({
  // Адрес, от которого считаются canonical, OG-теги и sitemap. Появится свой
  // домен — задать PUBLIC_SITE_URL в переменных окружения Render, код не менять.
  site: process.env.PUBLIC_SITE_URL || 'https://mvp-ai-solutions.onrender.com',
  output: 'static',
  integrations: [sitemap()],

  // Каждая страница — своя папка с index.html. Обработка адреса без слеша у
  // хостингов различается, поэтому канонический адрес всегда со слешем,
  // а вариант без слеша уводится редиректом в server.mjs.
  trailingSlash: 'always',

  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,

  vite: {
    plugins: [tailwind()],
  },
});
