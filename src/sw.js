import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 1. If app is already open, focus it
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // 2. If app is closed, open it
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Listener for custom 'SCHEDULE_REMINDER' message from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
        // Note: True background scheduling without a backend push server is 
        // strictly limited by browser support (Notification Triggers API).
        // This is a best-effort implementation for supported browsers (Android/Chrome flags).

        if ('showTrigger' in Notification.prototype) {
            const title = 'Daily Check-In';
            const options = {
                body: "Have you spent anything today? Record it now.",
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: 'daily-reminder',
                showTrigger: new TimestampTrigger(event.data.timestamp) // API Feature
            };
            self.registration.showNotification(title, options);
        }
    }
});
