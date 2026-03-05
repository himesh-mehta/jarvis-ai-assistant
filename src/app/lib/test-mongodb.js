const { MongoClient } = require('mongodb');
const dns = require('dns');

const uri = "mongodb+srv://amayadav06_db_user:Aman1234@jarvis.upmkip9.mongodb.net/jarvis_db?retryWrites=true&w=majority";

async function testConnection() {
    console.log("--- MongoDB Diagnostic Test ---");
    console.log("URI:", uri.replace(/:\/\/.*@/, "://<REDACTED>@"));

    // 1. Test DNS SRV Resolution
    console.log("\n1. Testing DNS SRV resolution...");
    try {
        const srv = await dns.promises.resolveSrv('_mongodb._tcp.jarvis.upmkip9.mongodb.net');
        console.log("✅ DNS SRV Result:", JSON.stringify(srv, null, 2));
    } catch (err) {
        console.error("❌ DNS SRV Failure:", err.code, err.message);
        console.log("\n💡 Possible causes:");
        console.log("- Your ISP or router is blocking SRV DNS queries.");
        console.log("- You need to change your DNS servers to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).");
    }

    // 2. Test Connection
    console.log("\n2. Trying to connect via MongoClient...");
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("✅ Successfully connected to MongoDB Atlas!");
        await client.close();
    } catch (err) {
        console.error("❌ Connection Failure:", err.message);
        if (err.message.includes("IP address") || err.message.includes("not authorized")) {
            console.log("\n💡 Possible causes:");
            console.log("- Your current IP is still NOT whitelisted in Atlas.");
            console.log("- The database user 'amayadav06_db_user' or password has changed.");
        }
    }
}

testConnection();
