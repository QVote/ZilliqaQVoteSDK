import logo from './logo.svg';
import './App.css';
// import MoonletZilliqaProvider from "@moonlet/providers/zilliqa";
import { useState, useEffect} from 'react'; 
import {ZilpayProvider, MoonletProvider} from "./provider.js"; 


function App() {

	const [state, setState] = useState({
		zilpay: "unknown", 
		moonlet: "unknown", 
	}); 


	// check before which wallets are available

	useEffect(() => {
		// for some reason this only works at the first time. if you refresh the page it will give you unavailable no matter what (while still working)
		//
		if (typeof window.zilPay == 'undefined'){
			//setState({...state, zilpa:"unavailable"});
			console.log("zilpay unavailable");
			setState({...state, zilpay:"available"})
		} else {
			console.log("zilpay available")
		}

		// TODO check moonlet 
		
	}, [])

	return (
	<div className="App">
	  <header className="App-header">
		<img src={logo} className="App-logo" alt="logo" />
		<p>
		  Edit <code>src/App.js</code> and save to reload. {state.zilpay} , {state.moonlet}
		</p>
		<button onClick={() => console.log(state.connectionStatus)}>
			log status	
      	</button>
		<button onClick={() => {
			setState({...state, provider: new ZilpayProvider()});
			console.log("zilpay set");
		}}>
			select zilpay
      	</button>
		<button onClick={() => {
			setState({...state, provider: new MoonletProvider()});
			console.log("moonlet set"); 
		}}>
			select moonlet
      	</button>
		<button onClick={() => setState({...state, connectionStatus: state.provider.connect()})}>
			connect
      	</button>
		<button onClick={() => state.provider.getInfo()}>
			getinfo
      	</button>
	  </header>
	</div>
	);
}

export default App;
