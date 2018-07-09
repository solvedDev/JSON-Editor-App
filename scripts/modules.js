/**
 * SCRIPTS FOR MODULES
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class ModuleSystem {
	constructor(pApp) {
		this.app = pApp;
		this.data = this.app.loading_system.getCachedData("data/custom/modules.json");
		this.path = new Path();
		this.module_adder = new ModuleAdder(this.app, this.path);
	}

	addCustomComponents(pComponents) {
		let mod = this.findModule("entity", "components");
		if(mod) mod.modules = mod.modules.concat(pComponents);
	}

	/**
	 * Get the defined module
	 * @param {String} pType File type
	 * @param {String} pName Module name
	 */
	findModule(pType, pName) {
		for(let i = 0; i < this.data[pType].regions.length; i++) {
			if(this.data[pType].regions[i].name == pName) {
				return this.data[pType].regions[i];
			}
		}
	}

	getData(pPath, pObj) {
		return this.app.loading_system.getCachedData(pPath, pObj);
	}

	modify(pType, pObj) {
		let module_package = this.data[pType];
		if(module_package) {
			let regions = module_package.regions;
			for(let i = 0; i < regions.length; i++) {
				console.log("Parsing " + regions[i].name);
				for(let j = 0; j < regions[i].parse.length; j++) {
					this.parseModules(pObj, regions[i].parse[j], regions[i].modules);
				}
			}
		}
		return pObj;
	}

	parseModules(pObj, pPath, pModules) {
		let obj = this.getData(pPath, pObj);
		for(let i = 0; i < pModules.length; i++) {
			this.parseModule(obj, pPath, pModules[i], pObj);
		}
	}

	parseModule(pObj, pPath, pModule, pGlobalObj) {
		for(let key in pObj) {
			if(typeof pObj[key] != "function" && typeof pObj[key] == "object") {
				let path = pPath + "/" + key;
				if(this.parseDefine(pModule.define, path)) {
					let module = pObj[key];
					let vars = this.evaluateVars(pModule.vars, pPath, pModule);
					console.log("Found module!", module);
					pObj[key] = undefined;

					if(!pModule.foreach_index) {
						this.module_adder.add(pGlobalObj, module, path, pModule.modify, vars);
					} else {
						for(let i = 0; i < module.length; i++) {
							this.module_adder.add(pGlobalObj, module[i], path, pModule.modify, vars);
						}
					}
					
				} else {
					this.parseModule(pObj[key], path, pModule, pGlobalObj);
				}
			}
		}
	}

	evaluateVars(pVars, pPath, pModule) {
		let vars = Object.assign({}, pVars);
		for(let key in vars) {
			if(key[0] != "@") {
				vars[key] = new StringStatement(vars[key], this.path, pModule, pPath, vars).execute();
			}
		}
		return vars;
	}

	parseDefine(pDefine, pPath) {
		if(Array.isArray(pDefine)) {
			for(let i = 0; i < pDefine.length; i++) {
				if(new ModuleStatement(pDefine[i] + "_on_$(" + pPath + ")", this.path).execute()) {
					return true;
				}
			}
			return false;
		} else {
			return new ModuleStatement(pDefine + "_on_$(" + pPath + ")", this.path).execute();
		}
	}
}

class ModuleAdder {
	constructor(pApp, pPath) {
		this.app = pApp;
		this.path = pPath;
	}

	getData(pPath, pObj) {
		return this.app.loading_system.getCachedData(pPath, pObj);
	}

	add(pObj, pModule, pPath, pChanges, pVars) {
		for(let i = 0; i < pChanges.length; i++) {
			this.applyChange(pObj, pModule, pPath, pChanges[i], pVars);
		}
	}

	applyChange(pObj, pModule, pPath, pChange, pVars) {
		let path = new StringStatement(pChange.path, this.path, pModule, pPath, pVars).execute();
		let obj = this.getData(path, pObj);
		let parent = this.getData(path.pathUp(), pObj);
		let obj_key = path.split("/").pop();
		if(obj == undefined) {
			obj = this.buildPath(pObj, path);
			parent = this.getData(path.pathUp(), obj);
			obj = this.getData(path, obj);
		}

		for(let i = 0; i < pChange.values.length; i++) {
			if(pChange.values[i].key == "list") {
				if(Array.isArray(obj)) {
					obj.push(this.parseTemplate(pChange.values[i].template, pModule, pPath, pVars));
				} else {
					parent[obj_key] = [this.parseTemplate(pChange.values[i].template, pModule, pPath, pVars)];
				}
			} else {
				let key = new StringStatement(pChange.values[i].key, this.path, pModule, pPath, pVars).execute();
				obj[key] = this.parseTemplate(pChange.values[i].template, pModule, pPath, pVars);
			}
		}
	}

	parseTemplate(pObj, pModule, pModPath, pVars) {
		let obj = {};
		if(typeof pObj != "function" && typeof pObj == "object") {
			if(Array.isArray(pObj)) obj = [];
			for(let key in pObj) {
				if(key.includes("$")) {
					let eval_key = new StringStatement(key, this.path, pModule, pModPath, pVars).execute();
					obj[eval_key] = this.parseTemplate(pObj[key], pModule, pModPath, pVars);
				} else {
					obj[key] = this.parseTemplate(pObj[key], pModule, pModPath, pVars);
				}
			}
		} else if(pObj && typeof pObj != "function" && pObj.includes("$")) {
			return new StringStatement(pObj, this.path, pModule, pModPath, pVars).execute();
		} else {
			return app.parser.getAsCorrectType(pObj);
		}
		return obj;
	}

	buildPath(pObj, pPath, pFirst=true) {
		let arr = pPath.split("/");
		if(arr[0] != "") {
			let key = arr.shift();
			arr = arr.join("/");
			if(pObj[key] == undefined) {
				pObj[key] = {};
			}
			this.buildPath(pObj[key], arr, false);
		}
		if(pFirst) {
			return pObj;
		}
	}
}

class StringStatement {
	constructor(pStatement, pPath, pModule, pModulePath, pVars) {
		this.statement = pStatement;
		this.path = pPath;

		this.module = pModule;
		this.module_path = pModulePath;
		this.vars = pVars;
	}

	/**
	 * Execute the StringStatement
	 */
	execute(pDoCorrection=false) {
		if(this.statement[0] == "(") this.statement = this.statement.slice(1, -1);
		let arr = this.statement.split(" + ");

		if(arr.length == 1 && arr[0].includes("$")) {
			return new ModuleStatement(arr[0], this.path, this.module, this.module_path, this.vars).execute();
		}

		let val = "";
		for(let i = 0; i < arr.length; i++) {
			if(arr[i][0] != "$") {
				val += arr[i];
			} else {
				val += new ModuleStatement(arr[i], this.path, this.module, this.module_path, this.vars).execute();
			}
		}

		if(pDoCorrection) {
			return app.parser.getAsCorrectType(val.replace(/:/g, "_"));
		} 
		return app.parser.getAsCorrectType(val);
	}
}

class ModuleStatement extends FunctionStatement {
	constructor(pStatement, pPath, pModule, pModulePath, pVars) {
		super(pStatement, undefined, pPath);

		this.module = pModule;
		this.module_path = pModulePath;
		this.vars = pVars;
	}
	parseTypes(pObj) {
		if(typeof pObj == "object"){
			for(let key in pObj) {
				if(typeof pObj[key] != "function" && typeof pObj[key] == "string") {
					pObj[key] = app.parser.getAsCorrectType(pObj[key]);
				} else if(typeof pObj[key] == "object"){
					pObj[key] = this.parseTypes(pObj[key])
				}
			}
			return pObj;
		} else {
			return app.parser.getAsCorrectType(pObj);
		}
	}

	$module(pPath) {
		if(pPath) {
			return app.loading_system.getCachedData(pPath, this.module);
		}
		return this.parseTypes(this.module);
	}
	$module_path(pArg=0) {
		let arr = this.module_path.split("/");
		arr.splice(arr.length - pArg, pArg);
		return arr.join("/");
	}
	$var(pArg) {
		//pArg can be path
		let variable = app.loading_system.getCachedData(pArg, this.module);
		if(variable == undefined && (this.vars[pArg] || this.vars["@" + pArg])) {
			if(this.vars["@" + pArg] && !this.vars[pArg]) {
				//Local variable called as global: $var(example)
				variable = new StringStatement(this.vars["@" + pArg], this.path, this.module, this.module_path, this.vars).execute(true);
			} else if(pArg in this.vars) {
				//Global variable: $var(example)
				variable = this.vars[pArg];
			} else {
				//variable called as $var(@example)
				variable = new StringStatement(this.vars[pArg], this.path, this.module, this.module_path, this.vars).execute(true);
			}
		}
		return variable != undefined ? this.parseTypes(variable) : "_";
	}
	$small_uuid() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx_xxxx'.replace(/[xy]/g, function(pC) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (pC == 'x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	}
	$uuid() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function(pC) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (pC == 'x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	}
}