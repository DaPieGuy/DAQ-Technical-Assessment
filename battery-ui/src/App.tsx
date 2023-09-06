import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { LazyLog } from 'react-lazylog';

import './App.css';
import LiveValue from './live_value';
import RedbackLogo from './redback_logo.png';
import DataExportButton from './export_button';
import { config, generateData, generateLayout, style } from './plot';
import { generateStyle } from './log';

interface Signature {
    timestamp: number;
    temperature: number;
    isSafe: boolean;
}

function App() {
	const [smoothInterpolation, setSmoothInterpolation] = useState(false);
	const [incidents, setIncidents] = useState<string>("");
	const [errors, setErrors] = useState<string>("");
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

			if ("incidents.log" in message_obj) {
				setIncidents(message_obj["incidents.log"]);
			} else if ("errors.log" in message_obj) {
				setErrors(message_obj["errors.log"]);
			} else if ("signatures" in message_obj) {
				setSignatures(message_obj["signatures"]);
				setMedianSignature(message_obj["medianSignature"]);
			}
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
				<p className='title'>Live Battery Temperature</p>
				<div className='header-right'>
					<p className='label'>Current:</p>
					<LiveValue temp={parseFloat(latestSignature.temperature.toFixed(3))} isSafe={latestSignature.isSafe}/>
					<p className='label'>Median:</p>
					<LiveValue temp={parseFloat(medianSignature.temperature.toFixed(3))} isSafe={medianSignature.isSafe}/>
					<button onClick={() => setSmoothInterpolation(!smoothInterpolation)} className="export-button">
          				Toggle Interpolation
        			</button>
					<DataExportButton tempPoints={temperatures} timePoints={timestamps} />
				</div>
			</header>
			<div className='graph-container'>
				<Plot
					data={generateData(temperatures, timestamps, signatures.map((signature) => signature.isSafe ? 'green' : 'red'), smoothInterpolation)}
					layout={generateLayout(temperatures)}
					config={config}
					style={style}
				/>
				<div className='log-container'>
					<p className='log-label'>incidents.log:</p>
					<div style={generateStyle()}>
						<LazyLog text={incidents.length !== 0 ? incidents : 'No logged incidents\n'} caseInsensitive />
					</div>
					<p className='log-label'>errors.log:</p>
					<div style={generateStyle()}>
						<LazyLog text={errors.length !== 0 ? errors : 'No logged errors\n'} caseInsensitive />
					</div>
				</div>
			</div>
		</div>
    );
}

export default App;