import React, { useState, useRef, useEffect } from 'react';
import LiveValue from './live_value';
import RedbackLogo from './redback_logo.png';
import './App.css';
import Plot from 'react-plotly.js';
import { config, generateData, generateLayout, style } from './plot';
import DataExportButton from './export_button';

interface Signature {
    timestamp: number;
    temperature: number;
    isSafe: boolean;
}

function App() {
	const [signatures, setSignatures] = useState<Signature[]>([]);
	const [medianSignature, setMedianSignature] = useState<Signature>({
		timestamp: Date.now(),
		temperature: 0,
		isSafe: false,
	});

    const ws: any = useRef(null);

    useEffect(() => {
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
			setSignatures(message_obj["signatures"]);
			setMedianSignature(message_obj["medianSignature"]);
		};

      	ws.current = socket;

		return () => {
			socket.close();
		};
    }, []);

	// Extract the temperature and timestamp from signatures
	const temperatures: number[] = signatures.map((signature) => signature.temperature);
	const timestamps: number[] = signatures.map((signature) => (signature.timestamp - signatures[0].timestamp) / 1000);
	const latestSignature: Signature = signatures.length !== 0
		? signatures[signatures.length - 1] : { temperature: 0, timestamp: 0, isSafe: false};

    return (
		<div className="App">
			<header className="App-header">
				<a href="https://www.facebook.com/UNSWRedbackRacing/" target="_blank" rel="noopener noreferrer">
        			<img src={RedbackLogo} className="redback-logo" alt="Redback Racing Logo" />
      			</a>
				<p className='value-title'>Live Battery Temperature</p>
				<div className='right-aligned-content'>
					<p className='value-temp-label'>Current:</p>
					<LiveValue temp={parseFloat(latestSignature.temperature.toFixed(3))} isSafe={latestSignature.isSafe}/>
					<p className='value-temp-label'>Median:</p>
					<LiveValue temp={parseFloat(medianSignature.temperature.toFixed(3))} isSafe={medianSignature.isSafe}/>
					<DataExportButton tempPoints={temperatures} timePoints={timestamps} />
				</div>
			</header>
			<Plot
				data={generateData(temperatures, timestamps, signatures.map((signature) => signature.isSafe ? 'green' : 'red'))}
				layout={generateLayout(temperatures)}
				config={config}
				style={style}
			/>
		</div>
    );
}

export default App;