import React from 'react';
import './App.css';

interface TemperatureProps {
  temp: number;
  isSafe: boolean;
}

function LiveValue({ temp, isSafe } : TemperatureProps) {

  let valueColour = (isSafe) ? 'green' : 'red';

  return (
      <header className="live-value" style={{ color : valueColour }}>
        {`${temp.toString()}°C`}
      </header>
  );
}

export default LiveValue;