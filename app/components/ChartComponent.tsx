// components/ChartComponent.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  ppgData: number[];
  valleys: { index: number; value: number }[];
}

export default function ChartComponent({
  ppgData,
  valleys,
}: ChartComponentProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode using matchMedia
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const chartData = {
    labels: Array.from({ length: ppgData.length }, (_, i) => i.toString()),
    datasets: [
      {
        label: 'PPG Signal',
        data: ppgData,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 0,
      },
      {
        label: 'Valleys',
        data: ppgData.map(
          (_, i) => valleys.find((v) => v.index === i)?.value || null
        ),
        pointBackgroundColor: 'red',
        pointRadius: 3,
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', // Grid lines adapt to dark mode
        },
        ticks: {
          color: isDarkMode ? 'white' : 'black', // Axis labels adapt to dark mode
        },
      },
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', // Grid lines adapt to dark mode
        },
        ticks: {
          color: isDarkMode ? 'white' : 'black', // Axis labels adapt to dark mode
        },
      },
    },
    animation: {
      duration: 0, // Disable animation for better performance
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? 'white' : 'black', // Legend text adapts to dark mode
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800 dark:text-white">
      <h2 className="text-lg font-semibold mb-2">PPG Signal</h2>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
