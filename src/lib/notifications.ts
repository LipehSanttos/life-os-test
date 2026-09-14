/**
 * @file notifications.ts
 * @description Utilitário de notificações web do navegador e PWA (Web Notifications API e Service Worker)
 * para alertar sobre tarefas vencendo, aniversários e lembretes financeiros, compatível com Android e Desktop.
 */

/**
 * Solicita permissão ao usuário para emitir notificações na área de trabalho ou no Android.
 *
 * @returns Promessa com o estado da permissão concedida ('granted' | 'denied' | 'default' | null)
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        return await Notification.requestPermission();
      } catch {
        return null;
      }
    }
    return Notification.permission;
  }
  return null;
}

/**
 * Dispara uma notificação nativa.
 * No Android/PWA, utiliza o ServiceWorkerRegistration.showNotification (obrigatório pelo sistema).
 * No desktop, faz fallback para o construtor padrão new Notification caso o Service Worker não esteja pronto.
 *
 * @param title Título do alerta da notificação
 * @param options Opções adicionais como corpo da mensagem, ícone e vibração
 */
export async function sendBrowserNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notificationOptions: NotificationOptions = {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  };

  // Método prioritário para Android / PWA: usar ServiceWorkerRegistration.showNotification
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, notificationOptions);
        return;
      }
    } catch {
      // Continua para o fallback se houver falha no Service Worker
    }
  }

  // Fallback para navegadores Desktop que aceitam new Notification()
  try {
    new Notification(title, notificationOptions);
  } catch (e) {
    console.warn("Falha ao emitir notificação nativa do navegador:", e);
  }
}
