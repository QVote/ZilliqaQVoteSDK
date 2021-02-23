import logo from './logo.svg';
import './App.css';
// import MoonletZilliqaProvider from "@moonlet/providers/zilliqa";
import { useState} from 'react'; 
import {Zilliqa} from '@zilliqa-js/zilliqa'; 
// import {getProvider} from "./provider.js"; 
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');


async function getProvider() {
	try {
		const result = await window.zilPay.wallet.connect()
		return window.zilPay.provider;
	} catch(e) {
		console.log(e)
	}
}


async function getBalance(address, zil) {
    try {       // Get Balance
        const balance = await zil.blockchain.getBalance(address);
        console.log(`Balance of ${address} : `);
        console.log(balance)
        return balance;
    } catch (e) { throw e; }
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
		<button onClick={()=>getProvider().then(res => {
								const zil = window.zilPay;
								zil.blockchain.getBalance('zil1zuml0tfkrjn7gu3p98z8ruxj658h7jp0d9f0uw')
									.then(console.log);
							})
		}>
			connect
      	</button>
		<button onClick={() => {
			// window.zilPay.blockchain.getBalance('zil1wl38cwww2u3g8wzgutxlxtxwwc0rf7jf27zace').then(console.log)
			// const zil = new Zilliqa("", window.zilPay.provider);  // this works 
			// zil.blockchain.getBalance('zil1wl38cwww2u3g8wzgutxlxtxwwc0rf7jf27zace').then(console.log)
			getProvider().then((p) => {
				console.log(p)
				const zil = new Zilliqa("", p)
				zil.blockchain.getBalance('zil1wl38cwww2u3g8wzgutxlxtxwwc0rf7jf27zace').then(console.log)
			});
		}}>
			log
      	</button>
		<button onClick={() => {
			console.log('sending to, zil1zuml0tfkrjn7gu3p98z8ruxj658h7jp0d9f0uw'); 
		}}>
			test 
      	</button>
	  </header>
	</div>
	);
}

export default App;
