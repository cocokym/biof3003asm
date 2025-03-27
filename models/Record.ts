import mongoose, { Schema, Document } from 'mongoose';

export interface RecordDocument extends Document {
  subjectId: string;
  heartRate: {
    bpm: number;
    confidence: number;
  };
  hrv: {
    sdnn: number;
    confidence: number;
  };
  ppgData: number[];
  timestamp: Date;
}

const RecordSchema = new Schema({
  subjectId: { 
    type: String, 
    required: true,
    index: true // Add index for better query performance
  },
  heartRate: { 
    bpm: Number, 
    confidence: Number 
  },
  hrv: { 
    sdnn: Number, 
    confidence: Number 
  },
  ppgData: [Number],
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // Add index for timestamp-based queries
  }
});

// Add compound index for subject-specific queries
RecordSchema.index({ subjectId: 1, timestamp: -1 });

const Record = mongoose.models.Record || mongoose.model<RecordDocument>('Record', RecordSchema);

export default Record;