export const scheduleDailyReminder = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        return;
    }

    // Check Permission
    if (Notification.permission !== 'granted') {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Calculate Next 5:00 PM
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(17, 0, 0, 0); // 5:00 PM

        if (now > scheduledTime) {
            // If already past 5 PM today, schedule for tomorrow
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timestamp = scheduledTime.getTime();

        // 1. Try Experimental Notification Triggers (Client Side Scheduling)
        // This allows the browser to wake up and show notification at exact time
        if ('showTrigger' in Notification.prototype) {
            // Send message to SW to schedule using internal logic if needed, 
            // OR strictly speaking, we can do it from main thread if registration is active.
            // But doing it via SW message ensures SW context is aware.

            // Actually, 'showTrigger' is usually passed to registration.showNotification
            // We can do this directly here:
            registration.showNotification("Daily Check-In", {
                body: "Have you spent anything today? Record it now.",
                icon: '/pwa-192x192.png',
                tag: 'daily-reminder', // unique tag replaces old ones
                showTrigger: new TimestampTrigger(timestamp)
            });
            console.log("Scheduled Check-In for:", scheduledTime.toLocaleString());
        } else {
            console.log("Notification Triggers not supported. Using fallback logic.");
            // Fallback: We can't guarantee execution if closed.
            // The best we can do is hope the SW is running (unlikely if closed) 
            // or rely on Periodic Background Sync if installed.
        }

    } catch (error) {
        console.error("Failed to schedule reminder:", error);
    }
};
