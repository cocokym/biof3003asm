export interface PPGDataPoint {
    timestamp: number;
    value: number;
  }
  
  export interface Valley {
    timestamp: number;
    value: number;
    index: number;
  }

export interface RecordData {
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

export interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
  lastAccessDate?: string;
}
