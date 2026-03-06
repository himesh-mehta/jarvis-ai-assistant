import mongoose from 'mongoose';

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Please define MONGODB_URI in .env.local');
  
  const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('Connecting to MongoDB with URI:', sanitizedUri);

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then(m => m);
  }

  cached.conn = await cached.promise;
  console.log('Successfully connected to MongoDB');
  (global as any).mongoose = cached;
  return cached.conn;
}