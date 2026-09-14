/**
 * @file sw.js
 * @description Service Worker do Life OS para suporte a PWA e notificações no Android.
 * Permite exibir alertas via showNotification e processar cliques mesmo em segundo plano.
 */

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  // Força ativação imediata sem esperar o encerramento de abas anteriores
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  // Reivindica controle imediato de todas as páginas abertas
  event.waitUntil(self.clients.claim());
});

// Manipulação do clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  // Foca na janela aberta do Life OS ou abre uma nova
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Manipulação de notificações push recebidas em segundo plano
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Life OS",
    body: "Você possui uma nova notificação.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    url: "/",
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        url: payload.url || notificationData.url,
      };
    }
  } catch {
    if (event.data) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url,
    },
  };

  event.waitUntil(self.registration.showNotification(notificationData.title, options));
});
