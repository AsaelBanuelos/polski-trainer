import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// REPO NAME
const REPO_NAME = "polski-trainer";

// Base final para GitHub Pages: https://usuario.github.io/REPO_NAME/
const BASE = `/${REPO_NAME}/`;

export default defineConfig({
    base: BASE,
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Polish Trainer",
                short_name: "Polish",
                start_url: BASE,
                scope: BASE,
                display: "standalone",
                background_color: "#242424",
                theme_color: "#242424",
                icons: [
                    { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
                    { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
                ],
            },
        }),
    ],
});
