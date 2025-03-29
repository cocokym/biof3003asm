// hooks/useSignalQuality.ts
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface SignalQualityResults {
  signalQuality: string;
  qualityConfidence: number;
}

export default function useSignalQuality(
  ppgData: number[]
): SignalQualityResults {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>('--');
  const [qualityConfidence, setQualityConfidence] = useState<number>(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log('Model loaded successfully:', loadedModel);
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (ppgData.length >= 100) {
      assessSignalQuality(ppgData);
    }
  }, [ppgData]);

  const assessSignalQuality = async (signal: number[]) => {
    if (!modelRef.current || signal.length < 100) return;

    try {
      const features = await calculateFeatures(signal);
      const inputTensor = tf.tensor2d([features]);
      const prediction = modelRef.current.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();

      const classIndex = probabilities.indexOf(Math.max(...probabilities));
      const classes = ['bad', 'acceptable', 'excellent'];
      const confidence = probabilities[classIndex] * 100;

      setSignalQuality(classes[classIndex]);
      setQualityConfidence(confidence);

      tf.dispose([inputTensor, prediction]);
    } catch (error) {
      console.error('Error assessing signal quality:', error);
    }
  };

  const calculateFeatures = async (signal: number[]): Promise<number[]> => {
    if (signal.length === 0) return new Array(15).fill(0);

    // Time-domain features
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const std = Math.sqrt(
      signal.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / signal.length
    );
    const sorted = [...signal].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const var_ = std ** 2;
    const signalRange = Math.max(...signal) - Math.min(...signal);
    
    // Higher-order statistics
    const skewness = std === 0 ? 0 : 
      signal.reduce((a, x) => a + Math.pow(x - mean, 3), 0) / 
      (signal.length * Math.pow(std, 3));
    const kurtosis = std === 0 ? 0 : 
      (signal.reduce((a, x) => a + Math.pow(x - mean, 4), 0) / 
      (signal.length * Math.pow(std, 4))) - 3;

    // Signal characteristics
    const zeroCrossings = signal.slice(1).reduce((count, x, i) => 
      (signal[i] * x < 0) ? count + 1 : count, 0);
    const rms = Math.sqrt(signal.reduce((a, x) => a + x**2, 0) / signal.length);
    const iqr = sorted[Math.floor(sorted.length * 0.75)] - sorted[Math.floor(sorted.length * 0.25)];
    const mad = sorted.reduce((a, x) => a + Math.abs(x - median), 0) / signal.length;

    // Frequency-domain features
    const fftTensor = tf.spectral.fft(tf.tensor1d(signal));
    const fftData = await fftTensor.data();
    fftTensor.dispose();

    const magnitudes: number[] = [];
    for (let i = 0; i < fftData.length; i += 2) {
      magnitudes.push(Math.hypot(fftData[i], fftData[i + 1]));
    }
    const halfMagnitudes = magnitudes.slice(0, Math.ceil(magnitudes.length / 2));
    const spectralEnergy = halfMagnitudes.reduce((a, b) => a + b, 0);
    const spectralEntropy = -halfMagnitudes
      .map(m => m / (spectralEnergy + 1e-7))
      .reduce((a, m) => a + (m > 0 ? m * Math.log(m + 1e-7) : 0), 0);

    // Peak detection
    let numPeaks = 0;
    try {
      let prev = signal[0];
      let increasing = false;
      numPeaks = signal.slice(1).reduce((count, x) => {
        if (x > prev && !increasing) {
          increasing = true;
        } else if (x < prev && increasing) {
          count++;
          increasing = false;
        }
        prev = x;
        return count;
      }, 0);
    } catch {
      numPeaks = 0;
    }

    // SNR calculation (dB)
    const snr = var_ === 0 ? 0 : 10 * Math.log10((mean ** 2) / var_);

    return [
      mean, std, median, var_, skewness,
      kurtosis, signalRange, zeroCrossings,
      rms, iqr, mad, spectralEnergy,
      spectralEntropy, numPeaks, snr
    ];
  };

  return { signalQuality, qualityConfidence };
}