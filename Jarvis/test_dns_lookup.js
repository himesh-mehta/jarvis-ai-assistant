const dns = require('dns');

dns.lookup('jarvis.upmkip9.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS lookup failed:', err);
    return;
  }
  console.log('Lookup Addresses:', addresses);
});
