/**
 * SCRIPTS FOR DATA LOADING FUNCTIONALITY
 * [!!!] NOT IN USE
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class RequestSystem {
	constructor(pParent) {
		this.cached_data = {};
		this.load_files = 0;
		this.total_files = 0;
		this.parent = pParent;

		this.onReady = undefined;
		this.onChange = undefined;
	}

	/**
	 * Request a JSON file from the internet
	 * @param {String} pPath 
	 * @param {Function} pContinue Arguments: Data & context
	 */
	request(pPath, pContinue) {
		this.load_files++;
		this.total_files++;
		if(this.onChange){
			let progress = 100 - Math.round(this.load_files / this.total_files * 1000) / 10;
			this.onChange(progress + "%", this.parent);
		}

		fetch("https://solveddev.github.io/JSON-Editor-Data/" + pPath)
			.then(pResponse => pResponse.text())
			.then(pText => this.onRequestReady(pPath, JSON.parse(JSON.minify(pText)), pContinue, this))
			.catch(pError =>  console.log(pPath + ": " + pError));
	}
	/**
	 * Request a file from the internet
	 * @param {String} pPath 
	 * @param {Function} pContinue Arguments: Data & context
	 */
	requestString(pPath, pContinue) {
		this.load_files++;
		this.total_files++;
		if(this.onChange){
			let progress = 100 - Math.round(this.load_files / this.total_files * 1000) / 10;
			this.onChange(progress + "%", this.parent);
		}

		fetch("https://solveddev.github.io/JSON-Editor-Data/" + pPath)
			.then(pResponse => pResponse.text())
			.then(pText => this.onRequestReady(pPath, pText, pContinue, this))
			.catch(pError =>  console.warn(pPath + ": " + pError));
	}
	onRequestReady(pPath, pData, pContinue, pSelf=this) {
		pSelf.cacheData(pPath, pSelf.cached_data, pData, pSelf);

		if(pContinue != undefined) pContinue(pData, pSelf);

		pSelf.load_files--;
		if(pSelf.onChange){
			let progress = 100 - Math.round(pSelf.load_files / pSelf.total_files * 1000) / 10;
			pSelf.onChange(progress + "%", pSelf.parent);
		}
		if(pSelf.load_files <= 0 && pSelf.onReady) {
			pSelf.onReady(pSelf.parent);
		}
		return pData;
	}

	/**
	 * Stores requested data
	 * @param {Array<String>|String} pPath The path describing where to save data
	 * @param {Object} pDict The dict in which  you want to save the data
	 * @param {any} pData The data to save
	 * @param {Object} pSelf Context
	 * @returns {Object} Modified dict
	 */
	cacheData(pPath, pDict, pData, pSelf=this) {
		if(typeof pPath == "string") {
			pPath = pPath.split("/");
		}
		let my_key = pPath.shift();
		let dict = pDict;

		if(pPath.length > 0) {
			if(!dict[my_key]) dict[my_key] = {};
			dict[my_key] = pSelf.cacheData(pPath, dict[my_key], pData, pSelf);
		} else {
			dict[my_key] = pData;
		}
		return dict;
	}
	/**
	 * Get data from the cache
	 * @param {Array<String>|String} pPath Path to data
	 * @param {Object} pDict Object to use the path on
	 * @param {Object} pSelf Context
	 * @returns {Object} Requested data
	 */
	getCachedData(pPath, pDict=this.cached_data, pSelf=this) {
		if(typeof pPath == "string") {
			pPath = pPath.split("/");
		}
		let my_key = pPath.shift();
		
		let dict = pDict;

		if(pPath.length > 0) {
			return pSelf.getCachedData(pPath, dict[my_key]);
		} else {
			return dict[my_key];
		}
	}
}

class LoadingSystem extends RequestSystem {
	constructor(pParent) {
		super(pParent);
	}
	/**
	 * Loads all files from the load_definition.json file
	 */
	loadAll() {
		this.request("load_definition.json", function(pData, pSelf) {
			if(pSelf.parent.is_desktop_app) pSelf.requestString("data/newest_app_version.txt");

			//HTML
			for(let i = 0; i < pData.html.length; i++) {
				pSelf.requestString("data/html/" + pData.html[i]);
			}

			//Other
			for(let i = 0; i < pData.other.length; i++) {
				pSelf.request("data/" + pData.other[i]);
			}

			//BP
			for(let i = 0; i < pData.entities.length; i++) {
				pSelf.request("data/BP/entities/" + pData.entities[i] + ".json");
			}
			for(let i = 0; i < pData.loot_tables.length; i++) {
				pSelf.request("data/BP/loot_tables/" + pData.loot_tables[i]);
			}
			for(let i = 0; i < pData.trades.length; i++) {
				pSelf.request("data/BP/trading/" + pData.trades[i]);
			}
			for(let i = 0; i < pData.recipes.length; i++) {
				pSelf.request("data/BP/recipes/" + pData.recipes[i]);
			}

			//RP
			for(let i = 0; i < pData.models.length; i++) {
				pSelf.request("data/RP/models/" + pData.models[i]);
			}
			for(let i = 0; i < pData.ui.length; i++) {
				pSelf.request("data/RP/ui/" + pData.ui[i]);
			}

			//Extension
			pSelf.request("extensions/gm1_pack.json");
		});
	}
}