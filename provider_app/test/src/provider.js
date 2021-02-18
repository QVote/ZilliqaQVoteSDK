import MoonletZilliqaProvider from "@moonlet/providers/zilliqa";

// TODO this should be an abstract class, then each different provider should have it's oww specific type 
/* class Provider{
	constructor(wallet){
		this.wallet = wallet; 
	}

	connect(){
		var s; 
		switch(this.wallet){
			case "zilpay":
				s = window.zilPay.wallet.connet(); 
			case "moonlet": 
				s = 0;
		}
		return s
	}
	
	get status(){
		return 
	}
} */ 

class ZilpayProvider{   // extends Provider
	constructor(){}

	async connect(){
		//return await window.zilPay.wallet.connect()
		console.log("zilpay connecting", window.zilPay.wallet.isConnect) 
		window.zilPay.wallet.connect().then((res) => {
			console.log(res);
			return res})
	}

	get connectionStatus() {
		return window.zilPay.wallet.isConect; 
	}
}


class MoonletProvider{
	constructor(){
		this.provider = new MoonletZilliqaProvider(); 
	}

	async connect(){
		console.log("moonlet connecting", this.provider.isConnected()) 
		if (!this.provider.isConnected()){
			try {
				this.provider.connect(true).then((address) => {
					console.log(address); 
					if (typeof address == 'undefined'){
						return false;
					}
					this.address = address; 
					return true; 
				}) 
			} catch(e){
				console.log(e);
				return false; 
			}
		}
		return true; 
	}

	async getInfo(){
		console.log("trying to get info")
		this.provider.send('GetBlockchainInfo').then((res) => {
			console.log("info", res)
		});
	}
}

export {ZilpayProvider, MoonletProvider};

