import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  key:         { type: String, unique: true, required: true },
  name:        { type: String, required: true },
  userId:      { type: String, required: true },
  userEmail:   { type: String },
  permissions: {
    type:    [String],
    default: ['chat', 'search', 'vision', 'voice', 'file'],
  },
  rateLimit: {
    requestsPerDay: { type: Number, default: 100 },
    requestsPerMin: { type: Number, default: 10 },
  },
  usage: {
    totalRequests: { type: Number, default: 0 },
    todayRequests: { type: Number, default: 0 },
    lastResetDate: { type: String,  default: '' },
    lastUsed:      { type: Date },
  },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date,    default: Date.now },
  expiresAt: { type: Date,    default: null },
});

export default mongoose.models.ApiKey ||
  mongoose.model('ApiKey', ApiKeySchema);
// ```

// ---

// ## File Summary
// ```
// ✅ src/lib/models/ApiKey.ts    → MongoDB model
// ✅ src/app/api/keys/route.ts   → CRUD for keys
// ✅ src/app/api/widget/route.ts → Public chat API
// ✅ src/app/widget/page.tsx     → Chat iframe
// ✅ public/widget.js            → Embed script