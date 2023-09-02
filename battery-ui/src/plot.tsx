import Plot from 'react-plotly.js';
import React, { useState, useRef, useEffect } from 'react';

const NUM_PLOT_POINTS = 20;

const generateLayout = (tempPoints: any) => {
    return {
		plot_bgcolor: "#202020",
		paper_bgcolor: "#202020",
		xaxis: {
			title: "Time since Initialization (s)",
			showgrid: false,
			titlefont: {
				color: "white",
			},
				tickfont: {
				color: "white",
			},
		},
		yaxis: {
			title: "Temperature (°C)",
			showgrid: false,
			titlefont: {
				color: "white",
			},
				tickfont: {
				color: "white",
			},
			range: [0, Math.max(100, Math.max(...tempPoints.slice(-NUM_PLOT_POINTS)))], // Adjust as needed
		},
		autosize: false,
		width: 2000,
		height: 950,
    };
  };
  
  export default generateLayout;

const config = {
    displayModeBar: false,
    staticPlot: true,
}

function generateData(tempPoints: number[], timePoints: number[]) {
	return [{
		y: tempPoints.slice(-NUM_PLOT_POINTS),
		x: timePoints.slice(-NUM_PLOT_POINTS),
		line: {
			color: 'white',
			width: 3
		}
	}];
}

export { config, generateLayout, generateData };