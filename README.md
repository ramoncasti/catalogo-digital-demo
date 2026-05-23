# Catalogo Digital con React + Tailwind

Esta versión quedó preparada como base moderna con:

- `React 18`
- `Vite`
- `Tailwind CSS`
- tienda pública
- carrito
- pedido directo a WhatsApp
- CMS simple dentro de la misma app
- persistencia local con `localStorage`

## Estructura nueva

- `index.html`: entrada de Vite
- `package.json`: scripts y dependencias
- `vite.config.js`: configuración de React + Tailwind
- `src/main.jsx`: bootstrap de React
- `src/App.jsx`: tienda, carrito y CMS
- `src/styles.css`: Tailwind + estilos base
- `public/store.json`: mock universal de tienda
- `public/schema.json`: contrato universal de datos

## Cómo usarlo

1. Instalar dependencias:
   `npm install`
2. Levantar entorno local:
   `npm run dev`
3. Abrir la URL que te muestre Vite.
4. Usar `Ver tienda` para la vista pública y `Abrir CMS` para administrar.

## Modelo universal

La app ahora intenta leer primero desde `localStorage` y, si no encuentra datos guardados, carga `public/store.json`.

La estructura esperada es:

- `store`
- `categories`
- `products`

Esto permite conectar el frontend a cualquier CMS, siempre que ese CMS entregue o se transforme a ese formato.

## Nota

Los archivos viejos (`admin.html`, `admin.js`, `app.js`, `shared.js`, `styles.css`) quedaron en la carpeta como referencia de la versión estática anterior, pero la app nueva usa la estructura de `src/`.
