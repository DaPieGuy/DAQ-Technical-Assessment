import React from 'react';

interface DataExportButtonProps {
    tempPoints: number[];
    timePoints: number[];
}

function DataExportButton({ tempPoints, timePoints }: DataExportButtonProps) {
    const handleExport = () => {
        if (tempPoints.length !== timePoints.length) {
            console.error('Arrays must have the same length');
            return;
        }

        const csvData = `time (since initialization),temperature (degrees Celsius)\n` +
        tempPoints.map((temp, index) => `${timePoints[index]},${temp}`).join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });

        // Create a temporary URL
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.csv';

        // Trigger the download
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
    };

    return (
        <button onClick={handleExport}>Export Data</button>
    );
}

export default DataExportButton;