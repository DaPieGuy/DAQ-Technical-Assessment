import React, { useState, useRef, useEffect } from 'react';
import LiveValue from './live_value';
import LineChart from './line_chart';
import RedbackLogo from './redback_logo.jpg';
import './App.css';

function App() {
  const [temperaturePoints, setTemperaturePoints] = useState<number[]>([]);
  const [temperature, setTemperature] = useState<number>(0);
  const [isTempSafe, setTempSafe] = useState<boolean>(false);

  const ws: any = useRef(null);

  useEffect(() => {
    // using the native browser WebSocket object
    const socket: WebSocket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("opened");
    };

    socket.onclose = () => {
      console.log("closed");
    };

    socket.onmessage = (event) => {
      console.log("got message", event.data);
      let message_obj = JSON.parse(event.data);

      setTempSafe(message_obj["is_temp_safe"]);
      setTemperature(message_obj["battery_temperature"].toFixed(3));
      setTemperaturePoints((prevData) => [...prevData, message_obj["battery_temperature"]]);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="App">
    <header className="App-header">
    <img src={RedbackLogo} className="redback-logo" alt="Redback Racing Logo"/>
      <p className='value-title'>
        Live Battery Temperature
      </p>
      <LiveValue temp={temperature}/>
      <div className={`circle ${isTempSafe ? 'green' : 'red'}`}></div>
    </header>
    </div>
  );
}

export default App;