"use client";

import { useEffect } from "react";

/**
 * Componente que registra o Service Worker do Life OS no navegador.
 * Habilita os recursos de PWA, instalação no Android e notificações via showNotification.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Service worker registrado com sucesso
          if (process.env.NODE_ENV === "development") {
            console.info("Life OS: Service Worker registrado com sucesso no escopo:", registration.scope);
          }
        })
        .catch((error) => {
          console.warn("Life OS: Falha ao registrar Service Worker:", error);
        });
    }
  }, []);

  return null;
}
