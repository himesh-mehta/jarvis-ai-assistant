const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolveSrv('_mongodb._tcp.jarvis.upmkip9.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV lookup with 8.8.8.8 failed:', err);
    return;
  }
  console.log('SRV Addresses with 8.8.8.8:', addresses);
});
