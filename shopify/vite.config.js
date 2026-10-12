import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Builds the React islands into the theme's assets folder.
 *
 * Shopify's assets/ is flat — no subfolders, and every file is served from a
 * CDN by exact name. So this emits exactly two files with fixed names and no
 * code splitting: a theme cannot load a chunk whose name changes each build.
 *
 *   npm run build   (from shopify/)
 *
 * The output is committed with the theme, because Shopify has no build step of
 * its own: whatever is in assets/ is what the storefront gets.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
    build: {
        outDir: 'assets',
        emptyOutDir: false,
        // No hashed filenames and no manifest: Liquid references these by name.
        rollupOptions: {
            input: path.resolve(import.meta.dirname, 'src/islands.jsx'),
            output: {
                entryFileNames: 'shemakes-islands.js',
                chunkFileNames: 'shemakes-islands-[name].js',
                assetFileNames: 'shemakes-islands.[ext]',
                // One file. Shopify cannot serve a directory of chunks.
                inlineDynamicImports: true,
            },
        },
        target: 'es2019',
        cssCodeSplit: false,
        minify: 'esbuild',
    },
});
