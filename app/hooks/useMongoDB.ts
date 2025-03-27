// hooks/useMongoDB.ts
import { useState } from 'react';

interface RecordData {
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

interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
  lastAccessDate?: string;
}

export default function useMongoDB() {
  const [isUploading, setIsUploading] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    avgHeartRate: 0,
    avgHRV: 0,
  });

  const pushDataToMongo = async (recordData: RecordData) => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      const response = await fetch('/api/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save data');
      }

      return data.data;
    } catch (error) {
      console.error('🚨 Network error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const fetchHistoricalData = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/get-historical-data?subjectId=${subjectId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setHistoricalData({
          avgHeartRate: data.avgHeartRate || 0,
          avgHRV: data.avgHRV || 0,
          lastAccessDate: data.lastAccessDate 
            ? new Date(data.lastAccessDate).toLocaleString()
            : undefined,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch historical data');
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
      throw error;
    }
  };

  return {
    pushDataToMongo,
    fetchHistoricalData,
    historicalData,
    isUploading,
  };
}
