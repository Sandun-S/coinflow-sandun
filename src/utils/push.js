import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Key provided via Vite Environment Variable (locally in .env, remotely via GitHub Secrets)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush(userUid) {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Check if already saved in Firestore to avoid duplicates
    // This is a basic check; ideally use the endpoint as ID or check more robustly
    const subsRef = collection(db, 'push_subscriptions');
    const q = query(subsRef, where('endpoint', '==', subscription.endpoint));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(subsRef, {
            uid: userUid,
            subscription: JSON.parse(JSON.stringify(subscription)),
            createdAt: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        console.log('Push Subscription saved to Firestore');
    } else {
        console.log('Push Subscription already exists');
    }

    return subscription;
}
