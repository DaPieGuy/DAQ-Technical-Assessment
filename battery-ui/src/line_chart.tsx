import React, { useEffect, useRef } from 'react';
import Chart, { ChartOptions } from 'chart.js/auto';

interface LineChartProps {
  temperatures: number[];
}

const LineChart: React.FC<LineChartProps> = ({ temperatures }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy the previous chart instance if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Create a new chart instance
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [], // Empty labels array to hide numbers at the bottom
            datasets: [
              {
                label: 'Battery Temperature',
                data: temperatures,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
              },
            ],
          },
          options: {
            scales: {
              x: {
                display: false, // Hide the x-axis
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Temperature',
                },
              },
            },
          } as ChartOptions,
        });
      }
    }
  }, [temperatures]);

  return <canvas ref={chartRef}></canvas>;
};

export default LineChart;