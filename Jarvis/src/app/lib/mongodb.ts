import mongoose from 'mongoose';
import dns from 'dns';


let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Please define MONGODB_URI in .env.local');
  
  // Force Google DNS for SRV resolution if using mongodb+srv
  if (uri.startsWith('mongodb+srv')) {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      console.log('Forced Google DNS for MongoDB SRV resolution');
    } catch (e) {
      console.warn('Failed to set DNS servers:', e);
    }
  }

  const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('Connecting to MongoDB with URI:', sanitizedUri);

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(uri, opts).then(m => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log('Successfully connected to MongoDB');
  } catch (e) {
    cached.promise = null; // Reset promise on error so we can retry
    console.error('MongoDB Connection Error:', e);
    throw e;
  }
  
  (global as any).mongoose = cached;
  return cached.conn;
}