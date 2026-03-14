const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.jarvis.upmkip9.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV lookup failed:', err);
    return;
  }
  console.log('SRV Addresses:', addresses);
});
