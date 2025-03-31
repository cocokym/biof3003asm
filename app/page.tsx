'use client';
import { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricsCard from './components/MetricsCard';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import ChartComponent from './components/ChartComponent';
import usePPGProcessing from './hooks/usePPGProcessing';
import useSignalQuality from './hooks/useSignalQuality';
import useMongoDB from './hooks/useMongoDB';
import { toast } from 'react-hot-toast';

export default function Home() { 
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isRecording, setIsRecording] = useState(false);
  const [isSampling, setIsSampling] = useState(false); // New state for sampling
  const [isUploading, setIsUploading] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');
  const { pushDataToMongo: saveToMongo, fetchHistoricalData, historicalData } = useMongoDB();
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // Define refs for video and canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    ppgData,
    valleys,
    heartRate,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination, videoRef, canvasRef);

  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);

  // Confirm User Function
  const confirmUser = async () => {
    if (currentSubject.trim()) {
      setConfirmedSubject(currentSubject.trim());
      await fetchHistoricalData(currentSubject.trim());
    } else {
      alert('Please enter a valid Subject ID.');
    }
  };

  // Start or stop recording
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  useEffect(() => {
    let animationFrame: number;
    const processFrameLoop = () => {
      if (isRecording) {
        processFrame(); // Call the frame processing function
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };
    if (isRecording) {
      processFrameLoop();
    }
    return () => {
      cancelAnimationFrame(animationFrame); // Clean up animation frame on unmount
    };
  }, [isRecording]);

  // Automatically send data every 10 seconds
  // Automatically send data every second when sampling is enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isSampling && ppgData.length > 0) {
      intervalId = setInterval(() => {
        pushDataToMongo();
      }, 10000); // Send data every second
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSampling, ppgData]);

  const pushDataToMongo = async () => {
    if (!confirmedSubject) {
      toast.error('Please confirm a subject ID before saving data.');
      return;
    }

    if (isUploading) {
      toast.error('Upload in progress, please wait...');
      return;
    }

    const recordData = {
      subjectId: confirmedSubject,
      heartRate: {
        bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm,
        confidence: heartRate.confidence || 0,
      },
      hrv: {
        sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn,
        confidence: hrv.confidence || 0,
      },
      ppgData: ppgData,
      timestamp: new Date(),
    };

    const savePromise = saveToMongo(recordData);
    
    toast.promise(savePromise, {
      loading: 'Saving data...',
      success: `Data saved for subject: ${confirmedSubject}`,
      error: 'Failed to save data. Please try again.',
    });

    try {
      await savePromise;
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  return (
    <div className="min-h-full">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm dark:bg-gray-800 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Please input your subject ID and confirm it:
            </h1>
            {/* User Authentication Section */}
            <div className="flex items-center gap-4">
              <div className="input max-w-sm flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus-within:ring-2 focus-within:ring-cyan-600">
                {/* Leading Icon */}
                <span className="icon-[tabler--user] text-gray-500 dark:text-gray-400 my-auto size-5 shrink-0"></span>
                <div className="grow">
                  <label className="sr-only" htmlFor="subjectIdInput">
                    Subject ID
                  </label>
                  <input
                    type="text"
                    id="subjectIdInput"
                    value={currentSubject}
                    onChange={(e) => setCurrentSubject(e.target.value)}
                    placeholder="Enter Subject ID"
                    className={`w-full bg-transparent border-0 py-1.5 px-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none`}
                  />
                </div>
              </div>
              <button
                onClick={confirmUser}
                className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
              >
                Confirm User
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-8 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Historical Data Section */}
          {confirmedSubject && historicalData && (
            <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Historical Data</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-700 px-4 py-5 shadow">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Last Access</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {historicalData.lastAccessDate || 'No records'}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-700 px-4 py-5 shadow">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Avg Heart Rate</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {historicalData.avgHeartRate} BPM
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-700 px-4 py-5 shadow">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Avg HRV</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {historicalData.avgHRV} ms
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Camera Feed */}
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Camera Feed</h2>
                  <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
                  {/* Buttons for Camera Feed */}
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`px-4 py-2 rounded-md text-white font-medium ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                          : 'bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700'
                      }`}
                    >
                      {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
                    </button>
                    <button
                      onClick={() => setIsSampling(!isSampling)}
                      className={`px-4 py-2 rounded-md text-white font-medium ${
                        isSampling
                          ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                          : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
                      }`}
                      disabled={!isRecording}
                    >
                      {isSampling ? '⏹ Stop Sampling' : '⏺ Start Sampling'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Signal Configuration */}
              {showConfig && (
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                  <div className="p-4">
                    <SignalCombinationSelector
                      signalCombination={signalCombination}
                      setSignalCombination={setSignalCombination}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* PPG Signal Processing Field */}
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">PPG Signal Processing</h2>
                  <ChartComponent ppgData={ppgData} valleys={valleys} />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={pushDataToMongo}
                      className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
                    >
                      Save to MongoDB
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricsCard
                  title="HEART RATE"
                  value={{ bpm: heartRate?.bpm || 0 }}
                  unit="BPM"
                  confidence={heartRate?.confidence || 0}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                />
                <MetricsCard
                  title="HRV"
                  value={{ sdnn: hrv?.sdnn || 0 }}
                  unit="ms"
                  confidence={hrv?.confidence || 0}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                />
                <MetricsCard
                  title="SIGNAL QUALITY"
                  value={{ quality: signalQuality || '--' }}
                  unit=""
                  confidence={qualityConfidence || 0}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}