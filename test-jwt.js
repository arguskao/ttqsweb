import jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIwLCJlbWFpbCI6IndpaTU0M0BnbWFpbC5jb20iLCJ1c2VyVHlwZSI6Imluc3RydWN0b3IiLCJpYXQiOjE3NjE3OTQyNjksImV4cCI6MTc2MTg4MDY2OSwiYXVkIjoicGhhcm1hY3ktYXNzaXN0YW50LWFjYWRlbXktdXNlcnMiLCJpc3MiOiJwaGFybWFjeS1hc3Npc3RhbnQtYWNhZGVteSJ9.TQ4X_Up0i0Rf7g3fCbYN__DBvOefkqEdPXV8Vk5ofzw';

const secrets = ['3939889', 'test-secret'];

console.log('Testing JWT verification with different secrets:');

for (const secret of secrets) {
    try {
        const decoded = jwt.verify(token, secret);
        console.log(`✅ Success with secret "${secret}":`, JSON.stringify(decoded, null, 2));
    } catch (error) {
        console.log(`❌ Failed with secret "${secret}":`, error.message);
    }
}
