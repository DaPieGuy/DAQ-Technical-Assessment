import React, { useState, useRef, useEffect } from 'react';
import LiveValue from './live_value';
import Circle from './circle';
import RedbackLogo from './redback_logo.png';
import './App.css';
import Plot from 'react-plotly.js';
import { config, generateData, generateLayout } from './plot';
import DataExportButton from './export_button';

function App() {
    const [tempPoints, setTempPoints] = useState<number[]>([]);
    const [timePoints, setTimePoints] = useState<number[]>([]);
    const [temperature, setTemperature] = useState<number>(0);
    const [isTempSafe, setTempSafe] = useState<boolean>(false);

    const ws: any = useRef(null);
    const startTime: number = Date.now();

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
			setTempPoints((prevData) => [...prevData, message_obj["battery_temperature"]]);
			setTimePoints((prevData) => [...prevData, (message_obj["timestamp"] - startTime)/1000]);
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
				<p className='value-title'>Live Battery Temperature</p>
				<p className='value-currtemp'>Current:</p>
				<LiveValue temp={temperature}/>
				<Circle isTempSafe={isTempSafe}/>
				<DataExportButton tempPoints={tempPoints} timePoints={timePoints} />
			</header>
			<Plot
				data={generateData(tempPoints, timePoints)}
				layout={generateLayout(tempPoints)}
				config={config}
			/>
		</div>
    );
}

export default App;