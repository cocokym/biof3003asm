import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'react-hot-toast';

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
    const [modelLoaded, setModelLoaded] = useState<boolean>(false);

    // Load TensorFlow.js model
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
                modelRef.current = loadedModel;
                console.log('PPG quality assessment model loaded successfully');
                setModelLoaded(true);
                toast.success('Model loaded successfully!');
            } catch (error) {
                console.error('Error loading model:', error);
                toast.error('Failed to load the model.');
            }
        };
        loadModel();
    }, []);

    useEffect(() => {
        if (ppgData.length >= 100 && modelLoaded) {
            assessSignalQuality(ppgData);
        }
    }, [ppgData, modelLoaded]);

    const assessSignalQuality = useCallback(async (signal: number[]) => {
        console.log('Assessing signal quality for:', signal);
        if (!modelRef.current || signal.length < 100) return;

        try {
            const rawFeatures = await calculateFeatures(signal);
            console.log('Extracted raw features:', rawFeatures);

            // Create a 2D tensor with the correct shape
            const inputTensor = tf.tensor2d([rawFeatures], [1, rawFeatures.length]);
            console.log('Input tensor shape:', inputTensor.shape);

            const prediction = modelRef.current.predict(inputTensor) as tf.Tensor;
            const probabilities = await prediction.data();
            console.log('Model predictions (probabilities):', probabilities);

            const classIndex = probabilities.indexOf(Math.max(...probabilities));
            const classes = ['bad', 'acceptable', 'excellent'];
            const predictedClass = classes[classIndex];
            const confidence = probabilities[classIndex] * 100;

            console.log('Predicted class:', predictedClass);
            console.log('Confidence:', confidence);

            setSignalQuality(predictedClass);
            setQualityConfidence(confidence);

            inputTensor.dispose();
            prediction.dispose();
        } catch (error) {
            console.error('Error assessing signal quality:', error);
        }
    }, [setSignalQuality, setQualityConfidence]);

    const calculateFeatures = async (signal: number[]): Promise<number[]> => {
        if (signal.length === 0) return new Array(15).fill(0);

        // Time-domain features
        const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
        const std = Math.sqrt(
            signal.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / signal.length
        );
        const sorted = [...signal].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];

        // Higher-order statistics with numeric stability
        const skewness = std < 1e-7 ? 0 :
            signal.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0) /
            (signal.length * Math.pow(std, 3));

        const kurtosis = std < 1e-7 ? 0 :
            (signal.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0) /
             (signal.length * Math.pow(std, 4))) - 3;

        // Improved peak detection (local maxima)
        let numPeaks = 0;
        for (let i = 1; i < signal.length - 1; i++) {
            if (signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
                numPeaks++;
            }
        }

        // Frequency-domain features with proper normalization
        const fftTensor = tf.spectral.fft(
            tf.complex(tf.tensor1d(signal), tf.zerosLike(tf.tensor1d(signal)))
        );
        const fftData = await fftTensor.data();
        fftTensor.dispose();

        const magnitudes: number[] = [];
        for (let i = 0; i < fftData.length; i += 2) {
            magnitudes.push(Math.hypot(fftData[i], fftData[i + 1]));
        }

        const halfMagnitudes = magnitudes.slice(0, Math.ceil(magnitudes.length / 2));
        const spectralEnergy = halfMagnitudes.reduce((sum, m) => sum + m, 0);
        const spectralProbabilities = halfMagnitudes.map(m => m / (spectralEnergy + 1e-8));
        const spectralEntropy = -spectralProbabilities.reduce((sum, p) =>
            p > 0 ? sum + p * Math.log(p + 1e-8) : sum, 0
        );

        // SNR calculation using std instead of var for consistency
        const snr = std < 1e-7 ? 0 : 20 * Math.log10(mean / std);

        return [
            mean, std, median, std**2, skewness,
            kurtosis, Math.max(...signal) - Math.min(...signal),
            signal.slice(1).reduce((count, x, i) => (signal[i] * x < 0) ? count + 1 : count, 0),
            Math.sqrt(signal.reduce((sum, x) => sum + x**2, 0) / signal.length),
            sorted[Math.floor(signal.length * 0.75)] - sorted[Math.floor(signal.length * 0.25)],
            sorted.reduce((sum, x) => sum + Math.abs(x - median), 0) / signal.length,
            spectralEnergy,
            spectralEntropy,
            numPeaks,
            snr
        ];
    };

    return { signalQuality, qualityConfidence };
}