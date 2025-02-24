let client;

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
  client = clients.matchAll().then(x => (client = x[0]));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  client.postMessage(event.notification.data);
});
