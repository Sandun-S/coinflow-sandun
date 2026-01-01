const admin = require('firebase-admin');
const webpush = require('web-push');

// Initialize Firebase Admin (Using Environment Variables)
// You need to set FIREBASE_SERVICE_ACCOUNT (JSON string) in GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initialize Web Push
// Set VAPID_SUBJECT (mailto:your-email), VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hakssiwantha@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendReminders() {
    console.log('Starting Daily Reminder Job...');

    try {
        const snapshot = await db.collection('push_subscriptions').get();

        if (snapshot.empty) {
            console.log('No subscriptions found.');
            return;
        }

        console.log(`Found ${snapshot.size} subscriptions.`);

        // Use Custom Message if provided (from send-message.yml), otherwise default Daily Reminder
        const title = process.env.CUSTOM_TITLE || 'Daily Check-In';
        const body = process.env.CUSTOM_BODY || "Have you spent anything today? Record it now.";
        const isCustom = !!process.env.CUSTOM_TITLE;

        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {
                timestamp: Date.now(),
                type: isCustom ? 'announcement' : 'daily-reminder'
            },
            actions: isCustom ? [] : [
                { action: 'nothing-spent', title: 'Nothing Spent' },
                { action: 'add-transaction', title: 'Add Transaction' }
            ]
        });

        const promises = [];

        snapshot.forEach(doc => {
            const sub = doc.data().subscription;
            const p = webpush.sendNotification(sub, payload)
                .then(() => console.log(`Sent to ${doc.id}`))
                .catch(err => {
                    if (err.statusCode === 410) {
                        console.log(`Subscription ${doc.id} expired/gone. Deleting...`);
                        return doc.ref.delete();
                    } else {
                        console.error(`Error sending to ${doc.id}:`, err);
                    }
                });
            promises.push(p);
        });

        await Promise.all(promises);
        console.log('Done.');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

sendReminders();
