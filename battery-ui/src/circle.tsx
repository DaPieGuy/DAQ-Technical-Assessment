import React from 'react';
import './App.css';

interface TempSafeProps {
    isTempSafe: boolean;
  }

function Circle({ isTempSafe } : TempSafeProps) {
  return <div className={`circle ${isTempSafe ? 'green' : 'red'}`}></div>;
}

export default Circle;