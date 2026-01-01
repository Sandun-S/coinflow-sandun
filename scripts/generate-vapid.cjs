const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('Paste this PUBLIC KEY into src/utils/push.js:');
console.log(vapidKeys.publicKey);
console.log('---------------------------------------');
console.log('Save this PRIVATE KEY for your Server (GitHub Secrets):');
console.log(vapidKeys.privateKey);
console.log('=======================================');
