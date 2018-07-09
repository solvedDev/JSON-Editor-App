/**
 * SCRIPTS FOR AUTO-COMPLETIONS FUNCTIONALITY
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class AutoCompletions {
	constructor(pApp, pEditor) {
		this.editor = pEditor;
		this.documentation_parser = pApp.documentation_parser;

		this.auto_data = this.editor.getCachedData("data/custom/auto_completions.json");
		this.completion_data = {};

		this.child_list = [];
		this.value_list = [];
		this.file_type = "";

		this.last_path = "";
		this.last_child_search = "";
		this.last_value_search = "";
		this.add_child_input = new DropDown(document.getElementById("add-child-input"), "input");
		this.add_child_input.create();
		this.add_value_input = new DropDown(document.getElementById("add-value-input"), "input");
		this.add_value_input.create();
		this.edit_input = new DropDown(document.getElementById("edit-input-div"), "input");
		this.edit_input.create();
	}
	/**
	 * TODO: Description
	 */
	init() {
		this.file_type = this.getFileType();
		this.editor.file_type = this.file_type;
		this.completion_data = this.auto_data[this.file_type];
		console.log("Opened new file of type: " + this.file_type);
	}

	/**
	 * Update the auto_completion lists
	 */
	update(pSearchChild=this.add_child_input.input.value, pSearchVal=this.add_value_input.input.value, pContextArgs=this.getArgsInContext()) {
		if(this.getPath() != this.last_path || this.last_child_search != pSearchChild || this.last_value_search != pSearchVal) {
			this.last_path = this.getPath();
			this.last_child_search = pSearchChild;
			this.last_value_search = pSearchVal;
			this.updateLists(pSearchChild, pSearchVal, pContextArgs);
		}
	}
	forceUpdate() {
		this.last_path = this.getPath();
		this.last_child_search = "";
		this.last_value_search = "";
		this.updateLists("", "", this.getArgsInContext());
	}
	updateInputs() {
		let path = this.editor.path;
		let child = this.add_child_input.list.getSelectedValue();
		let val = this.add_value_input.list.getSelectedValue();

		this.add_child_input.input.value = child ? child : "";
		this.add_value_input.input.value = val ? val : "";
		this.edit_input.input.value = path.getCurrentContext(false);
	}

	/**
	 * TODO: Description
	 */
	getPath() {
		return this.editor.path.getPath();
	}

	/**
	 * TODO: Description
	 */
	getFileType() {
		for(let key in this.auto_data) {
			if(new LogicStatement(this.auto_data[key].define, this.editor).execute()) {
				return key;
			}
		}
		console.warn("Unknown file type: " + this.editor.tab.getName());
	}

	/**
	 * DO NOT ACCESS DIRECTLY; USE update()
	 * TODO: Description
	 */
	updateLists(pSearchChild=this.add_child_input.input.value, pSearchVal=this.add_value_input.input.value, pContextArgs=[]) {
		if(this.completion_data != undefined) {
			this.child_list = [];
			this.value_list = [];

			let extend = this.completion_data.extend;
			if(extend) {
				for(let i = 0; i < extend.length; i++) {
					if(new LogicStatement(extend[i].recognize, this.editor).execute()) {
						let res = this.parsePropose(extend[i].propose);

						this.child_list = this.child_list.concat(res.c);
						this.value_list = this.value_list.concat(res.v);
					}
				}
			}

			this.add_child_input.list.addArray(this.child_list, pSearchChild, true, pContextArgs);
			this.add_value_input.list.addArray(this.value_list, pSearchVal, true, pContextArgs);
		}
	}

	/**
	 * Parses the "propose": [] array and returns two usable arrays
	 * @param {Array<Object>} pPropose Array containing the proposals
	 * @returns {Object} Attributes c & v with arrays
	 */
	parsePropose(pPropose) {
		let child_list = [];
		let value_list = [];

		for(let i = 0; i < pPropose.length; i++) {
			if(pPropose[i].function != undefined) {
				let res = new FunctionStatement(pPropose[i].function, this.editor).execute();
				if(res) {
					if(this.isChild(pPropose[i].type)) {
						child_list = child_list.concat(res);
					} else {
						value_list = value_list.concat(res);
					}
				}
			} else if(this.isChild(pPropose[i].type)) {
				child_list.push(pPropose[i]);
			} else {
				value_list.push(pPropose[i]);
			}
		}

		//child_list = child_list.filter(e => child_list.containsObj("key", e.key));
		//value_list = value_list.filter(e => value_list.containsObj("key", e.key));

		return { c: child_list, v: value_list };
	}

	isValue(pKey) {
		return !this.isChild(pKey);
	}
	isChild(pKey) {
		return pKey == "object" || pKey == "list" || pKey == "array";
	}

	getArgsInContext(pForceAll=false) {
		let currentSelected = this.editor.path.getCurrentContext();
		if(this.editor.path.getCurrentContext(false) == "") currentSelected = this.editor.editor_content;
		if(!pForceAll && currentSelected && currentSelected.parentElement) {
			try {
				if(currentSelected.tagName != "SPAN" && currentSelected.tagName != "DIV") {
					return Object.keys(app.parser.getObj(currentSelected.parentElement, false));
				} else if(currentSelected.tagName == "DIV") {
					return Object.keys(app.parser.getObj(currentSelected, true));
				}
			} catch(e) {
				return [];
			}
		} else {
			return [];
		}
	}
}

class LogicStatement {
	constructor(pStatement, pEditor) {
		this.statement = pStatement;
		this.editor = pEditor;
	}
	/**
	 * Execute the LogicStatement
	 * @returns {Boolean} Whether the statement is true
	 */
	execute() {
		if(this.statement[0] == "(") this.statement = this.statement.slice(1, -1);
		let arr = this.statement.split(" ");

		let val = new FunctionStatement(arr[0], this.editor).execute();
		for(let i = 1; i < arr.length; i += 2) {
			if(arr[i] == "and") {
				val = val && new FunctionStatement(arr[i+1], this.editor).execute();
			} else if(arr[i] == "or") {
				val = val || new FunctionStatement(arr[i+1], this.editor).execute();
			} else {
				console.warn("Unknown logic operator: " + arr[i]);
			}
		}

		return val;
	}
}

class FunctionStatement {
	constructor(pStatement, pEditor, pPath) {
		this.statement = pStatement;
		this.editor = pEditor;
		this.path = pPath;
		if(!pPath) this.path = this.editor.path;
	}
	/**
	 * Execute the FunctionStatement
	 * @returns {Boolean} Whether the statement is true
	 */
	execute() {
		if(!this.evaluated) this.evaluate();

		try {
			return eval(this.evaluated);
		} catch(e) {
			console.warn("Invalid function statement \"" + this.statement + "\":\n\n" + e);
		}
	}
	/**
	 * Evaluate the FunctionStatement
	 */
	evaluate() {
		let parts = this.statement.split("_on_");

		if(parts.length > 1){
			parts[1] = this.getFunction(parts[1]);
			parts[0] = this.getFunction(parts[0], parts[1]);
		} else {
			parts[0] = this.getFunction(parts[0]);
		}

		this.evaluated = parts[0];
	}
	/**
	 * Returns an -through eval()- executable JS function
	 * @param {String} pString 1 function statement
	 * @param {} pFuncArg Additional argument
	 */
	getFunction(pString, pFuncArg="") {
		let func = pString;
		if(func.contains("(")) {
			let func_core = pString.split("(")[0].replace(/(;)|(\n)|(\()|(\))/g, "");
			let args = "\"" + pString.split("(")[1].split(")")[0].split(", ").join("\", \"") + "\"";

			if(pFuncArg != "") args = args + "," + pFuncArg;
			//console.log(func_core, args);

			return "this." + func_core + "(" + args + ")";
		} else {
			return "this." + pString.replace(/(;)|(\n)|(\()|(\))/g, "") + "(" + pFuncArg + ")";
		}
		
	}

	//LOGIC FUNCTIONS
	/**
	 * Returns the value of the specified sibling
	 */
	$sibling_value(pSibling) {
		let path = this.editor.path.getPath().split("/");
		path.pop();
		path = path.join("/");
		let dict = app.loading_system.getCachedData(path, this.editor.tab.getObj());

		for(let key in dict){
			if(key == pSibling) {
				return dict[key];
			}
		}
	}
	$child_value(pChild) {
		let current = this.editor.path.getCurrentContext();
		
		if(this.editor.tree_manager.node_system.hasChildren(current)) {
			let path = this.editor.path.getPath();
			let dict = app.loading_system.getCachedData(path, this.editor.tab.getObj());

			if(path == "") dict = this.editor.tab.getObj();
			for(let key in dict){
				if(key == pChild) {
					return dict[key];
				}
			}
		}
	}
	$value() {
		let path = this.editor.path.getPath();
		let dict = app.loading_system.getCachedData(path, this.editor.tab.getObj());
		if(typeof dict == "string") {
			return dict;
		} else {
			return "";
		}
	}
	$as_chars(pType="string", pArr) {
		let arr = [];
		for(let i = 0; i < pArr.length; i++) {
			if(typeof pArr[i].key == "string") {
				for(let j = 0; j < pArr[i].key.length; j++) {
					if(!arr.containsObj("key", pArr[i].key[j])) {
						arr.push({ key: pArr[i].key[j], type: pType});
					}
				}
			} else {
				arr.push(pArr[i]);
			}
		}
		return arr;
	}
	//Helper for modules
	$(pArg) {
		return pArg;
	}
	//General logic stuff
	$is(pArg, pArg2=this.editor.path.getCurrentContext(false)) {
		return pArg2 == pArg;
	}
	$is_not(pArg, pArg2=this.editor.path.getCurrentContext(false)) {
		return !this.$is(pArg, pArg2)
	}
	$contains(pArg, pArg2=this.editor.path.getCurrentContext(false)) {
		return pArg2.contains(pArg);
	}
	$contains_not(pArg, pArg2=this.editor.path.getCurrentContext(false)) {
		return !this.$contains(pArg, pArg2);
	}
	$is_root() {
		return this.$is("");
	}
	$is_root_not() {
		return !this.$is_root();
	}
	$has_child(pName) {
		let path = this.editor.path.getPath();
		let dict = app.loading_system.getCachedData(path, this.editor.tab.getObj());
		if(path == "") dict = this.editor.tab.getObj();
		for(let key in dict){
			if(key == pName) {
				return true;
			}
		}
		return false;
	}
	$has_child_not(pName) {
		return !this.$has_child(pName);
	}
	$is_path(pArg, pArg2) {
		if(pArg2) return this.path.isPath(pArg, pArg2);
		return this.path.isPath(pArg);
	}
	$is_path_not(pArg, pArg2) {
		if(pArg2) return !this.$is_path(pArg, pArg2);
		return !this.$is_path(pArg);
	}

	//TODO: TYPE RECOGNIZING
	$is_type(pArg) {
		return false;
	}
	$is_type_not(pArg) {
		return !this.$is_type(pArg);
	}

	//PROPOSE FUNCTIONS
	$parse_documentation(pPath, pType="object", pPrefix="", pPushKey=false) {
		return this.parse_file(pPath, pType, pPrefix, app.documentation_parser.getDocumentation(), pPushKey);
	}
	$parse_file(pPath, pType="object", pPrefix="", pPushKey=true) {
		return this.parse_file(pPath, pType, pPrefix, this.editor.tab.getObj(), pPushKey);
	}
	parse_file(pPath, pType="object", pPrefix="", pDict=this.editor.tab.getObj(), pPushKey=true) {
		let arr = [];
		let dict = app.loading_system.getCachedData(pPath, pDict);

		if(typeof dict == "object") {
			for(let key in dict){
				if(typeof dict[key] != "function" && key != "__des__") {
					if((typeof pPushKey == "boolean" && pPushKey) || pPushKey == "true") {
						arr.push({ key: pPrefix + key, type: pType });
					} else {
						arr.push({ key: pPrefix + dict[key], type: pType });
					}
				}
			}
	
			return arr;
		}
		return [{ key: pPrefix + dict, type: pType }];
	}

	$next_list_index(pCap) {
		let path = this.editor.path.getPath();
		let arr = app.loading_system.getCachedData(path, this.editor.tab.getObj());
		if(arr.length == undefined) arr.length = 0;
		if(!pCap || arr.length <= pCap) return { key: arr.length, type: "object" };
	}

	$get_component_args() {
		let arr_path = this.editor.path.getPath().split("/");
		let component = arr_path[arr_path.length - 1];
		return this.$parse_documentation("components/" + component, "object", "", true);
	}
	$get_component_values() {
		let arr_path = this.editor.path.getPath().split("/");
		let component = arr_path[arr_path.length - 2];
		let arg = arr_path[arr_path.length - 1];
		return this.$parse_documentation("components/" + component + "/" + arg + "/default_value", "value", "", false);
	}
}