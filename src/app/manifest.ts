import { MetadataRoute } from "next";

/**
 * Configuração do Manifesto Web (PWA) para o Life OS.
 * Permite que a aplicação seja instalada no Android/iOS como um aplicativo autônomo (standalone).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life OS - Gestão Pessoal & IA",
    short_name: "Life OS",
    description: "Sistema Pessoal e Inteligente de Gestão de Vida, Tarefas, Finanças e Estudos.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48 72x72 96x96 128x128 256x256",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
