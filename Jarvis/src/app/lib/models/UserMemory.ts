import mongoose, { Schema, Document } from 'mongoose';

export interface IMemoryFact {
  category: 'personal' | 'preference' | 'technical' | 'behavioral' | 'goal';
  fact:     string;
  confidence: number;   // 0-1 how confident we are
  source:   string;     // which message it came from
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMemory extends Document {
  userId:    string;
  userEmail: string;
  facts:     IMemoryFact[];
  summary:   string;     // AI generated summary of the user
  updatedAt: Date;
}

const MemoryFactSchema = new Schema<IMemoryFact>({
  category:   { type: String, enum: ['personal', 'preference', 'technical', 'behavioral', 'goal'], required: true },
  fact:       { type: String, required: true },
  confidence: { type: Number, default: 0.8 },
  source:     { type: String, default: '' },
  createdAt:  { type: Date,   default: Date.now },
  updatedAt:  { type: Date,   default: Date.now },
});

const UserMemorySchema = new Schema<IUserMemory>(
  {
    userId:    { type: String, required: true, unique: true, index: true },
    userEmail: { type: String, required: true },
    facts:     [MemoryFactSchema],
    summary:   { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.UserMemory ||
  mongoose.model<IUserMemory>('UserMemory', UserMemorySchema);