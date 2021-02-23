import logo from './logo.svg';
import './App.css';
// import MoonletZilliqaProvider from "@moonlet/providers/zilliqa";
import { useState} from 'react'; 
import {Zilliqa} from '@zilliqa-js/zilliqa'; 
// import {getProvider} from "./provider.js"; 


async function getProvider() {
	try {
		window.zilPay.wallet.connect().then((res) => {
			console.log("connected"); 
			const provider = window.zilPay;
			console.log(provider);
			return provider; 
		})
	} catch(e) {
		console.log(e)
	}
}



function App() {

	const [state, setState] = useState({
		provider: null, 
		zilliqa: null
	}); 

	// check before which wallets are available

	return (
	<div className="App">
	  <header className="App-header">
		<img src={logo} className="App-logo" alt="logo" />
		<p>
		  Edit <code>src/App.js</code> and save to reload. {state.zilpay} , {state.moonlet}
		</p>
		<button onClick={() => {
			getProvider().then((p) => setState({provider: p, zilliqa: new Zilliqa(p)}));
			console.log('provider set'); 
		}}>
			connect
      	</button>
		<button onClick={() => {
			console.log('provider', state.provider);
			console.log('zilliqa', state.zilliqa); 
		}}>
			log
      	</button>


	  </header>
	</div>
	);
}

export default App;
