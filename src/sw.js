import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Handle Push Notifications (from Server)
self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || "Daily Check-In";
    const options = {
        body: data.body || "Did you spend anything today?",
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'daily-reminder',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: [
            { action: 'nothing-spent', title: 'Nothing Spent' },
            { action: 'add-transaction', title: 'Add Transaction' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});


// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const action = event.action; // 'nothing-spent' | 'add-transaction' | undefined (click on body)

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    // Optionally direct to specific route based on action?
                    // client.navigate('/add-transaction'); // If we had routing
                    return client.focus();
                }
            }
            // If app is closed, open it
            if (clients.openWindow) {
                // You could append ?action=add-transaction to URL to handle it on load
                const url = '/';
                return clients.openWindow(url);
            }
        })
    );
});

// Listener for custom 'SCHEDULE_REMINDER' message from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
        // ... previous logic kept if needed ...
        if ('showTrigger' in Notification.prototype) {
            // ...
        }
    }
});
