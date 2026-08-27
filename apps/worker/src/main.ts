const startedAt = new Date().toISOString();

console.log('RecoverAI worker started.');
console.log(`Started at: ${startedAt}`);
console.log('Queue consumers will be added in Module 5.');

setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, 30_000);
