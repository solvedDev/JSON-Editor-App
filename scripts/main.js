/**
 * MAIN FUNCTIONALITY OF JSON EDITOR
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

//APPLICATION
class Application {
	constructor() {
		this.loading_screen = new LoadingScreen();
		this.mobile_screen = new MobileScreen();

		this.parser = new Parser();
		this.loading_system = new LoadingSystem(this);
		this.dev_build = false;
		this.is_desktop_app = true;

		//SETUP CONFIG
		if(this.is_desktop_app) {
			this.fs = require("fs");
			this.config = {};
			this.fs.readFile("./data/config.json", 'utf8', callback.bind(this));
			function callback(pErr, pData) {
				return function() {
					this.config = JSON.parse(pData);
					if(pErr) console.warn(pErr);

					//HANDLE PROJECT BAR
					if(this.config.project_path) this.intermediary.renderProject(this.config.project_path);
				}.bind(this)();
			}
		}
	}

	start() {
		let is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 800 && window.innerHeight <= 600;
		if(this.is_desktop_app) is_mobile = false;

		if(is_mobile){
			this.openScreen(this.mobile_screen);
		} else {
			this.openScreen(this.loading_screen);
			console.log("No mobile device detected. Loading data...");

			//Register events
			this.loading_system.onReady = function(pSelf) {
				pSelf.editor_screen = new EditorScreen(this, pSelf.loading_system.getCachedData("data/html/editor_template.html"));
				pSelf.openScreen(pSelf.editor_screen, true);
				pSelf.editor_screen.init();

				if(pSelf.is_desktop_app) {
					document.querySelector("nav").style.display = "inline-block";
					pSelf.intermediary = require("./scripts/intermediary.js");
				}

				//Initialize tabs
				pSelf.tab_manager = new TabManager(document.getElementById("tab-bar")).create();
				pSelf.tab_manager.addTab("blank.json", {
					"minecraft:entity": {
						"format_version": "1.6.0",
						"component_groups": {},
						"components": {},
						"events": {}
					}
				});
				pSelf.tab_manager.start();

				//Documentation Parser
				pSelf.documentation_parser = new DocumentationParser(pSelf.loading_system);

				//Documentation
				pSelf.documentation = new Documentation(pSelf);

				//Module system
				pSelf.module_system = new ModuleSystem(pSelf);
				pSelf.extension_system = new ExtensionSystem(pSelf, pSelf.loading_system.getCachedData("extensions"));

				if(!pSelf.dev_build) document.getElementById("infobar").style.display = "none";
				if(pSelf.dev_build) document.getElementById("infobar").style.display = "block";
			};
			this.loading_system.onChange = function(pProgress, pSelf) {
				document.body.querySelector("p").innerText = "Progress: " + pProgress;
			};
			//Load data
			this.loading_system.loadAll();
		}
	}

	updateConfig() {
		this.fs.writeFile("./data/config.json", JSON.stringify(this.config, undefined, "\t"), () => console.log("Updated config.json!"));
	}

	/**
	 * Opens the screen handed over as a parameter
	 * @param {Screen} pScreen The screen to open
	 */
	openScreen(pScreen, pTryDesktop=false) {
		pScreen.initStyles();
		if(pTryDesktop && this.is_desktop_app) {
			let tmp = document.createElement("div");
			tmp.innerHTML = pScreen.getHtml();
			let open_dir = this.generateDir();
			document.body.innerHTML = tmp.firstElementChild.outerHTML + "<sidebar class='section'>" + open_dir + "</sidebar><main></main>";
			tmp.innerHTML = tmp.innerHTML.split("</nav>")[1];
			document.body.firstElementChild.nextElementSibling.nextElementSibling.innerHTML = tmp.innerHTML;
		} else {
			document.body.innerHTML = pScreen.getHtml();
		}
	}
	/**
	 * Generates project folder
	 */
	generateDir() {	
		return 	`<div class='center-text' style='position: relative; top: 40%;'>
					<p>Project Folder</p>
					<button id='open-project-folder-btn' class='btn btn-outline-primary center'>Open</button>
				</div>`;
	}

	openPopUp(pText) {
		let popup = new PopUpWindow("test", "90%", "90%", document.body, pText, true);
		popup.create();
	}

	loadFile(pFile, pIndex, pTotal) {
		let reader = new FileReader();
		//Opening loading window if first file
		if(pIndex == 0) {
			app.loading_window = new LoadingWindow().create();
			app.tab_manager.loaded_tabs = 0;
		}
		//Required vars
		reader.file_name = pFile.name;
		reader.total = pTotal;
	
		//Reading file
		reader.readAsText(pFile);
	
		reader.onload = function() {
			try {
				app.tab_manager.addTab(this.file_name, JSON.parse(JSON.minify(reader.result)), this.total);
			} catch(e) {
				console.warn("An error occurred while trying to open the file \"" + this.file_name + "\": ");
				console.log(e.message);
				new PushMessage(document.body, "Invalid JSON!").create();
			}
		}
	}

	download(pFileName, pText) {
		let element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pText));
		element.setAttribute('download', pFileName);
	  
		element.style.display = 'none';
		document.body.appendChild(element);
	  
		element.click();
		
		document.body.removeChild(element);
	}

	generateUUID() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(pC) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (pC == 'x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	}
	
	tick() {
		app.tab_manager.tick();

		if(app.dev_build) {
			let path =  "Path: " + app.tab_manager.getSelectedTab().editor.path.getPath();
			let type = " | Type: " + app.tab_manager.getSelectedTab().editor.auto_completions.file_type;
			document.getElementById("dev-display").innerHTML = path + type;
		}

		window.requestAnimationFrame(app.tick);
	}
}

//SCREENS
class Screen {
	/**
	 * Construct a new object of the type Screen
	 * @param {String} pHtml 
	 * @param {String} pStyle 
	 */
	constructor(pParent, pHtml, pStyle) {
		this.parent = pParent;
		this.html = pHtml;
		this.style = pStyle;
	}

	/**
	 * Initialize special styles for the screen
	 */
	initStyles() {
		document.body.classList.add("blue-background");
	}

	/**
	 * Get the HTML of this screen
	 * @returns HTML
	 */
	getHtml() {
		return this.html;
	}
	/**
	 * Get the style of this screen
	 * @returns CSS
	 */
	getStyle() {
		return this.style;
	}
}

class MobileScreen extends Screen {
	constructor(pParent) {
		super(pParent, "<div class='center blue-section'><h1 class='big'>:(</h1><br><br><h3>The JSON Editor cannot be used on mobile devices.</h3></div>");
	}
}

class EditorScreen extends Screen {
	constructor(pParent, pHTML) {
		super(pParent, pHTML);
	}
	/**
	 * Initialize special styles for the screen
	 */
	initStyles() {
		document.body.classList.remove("blue-background");
		document.body.style.height = window.innerHeight + "px";
	}

	init() {
		this.ui_elements = {
			import_json: document.getElementById("import-json"),
			download_json: document.getElementById("download-json"),
			add_child_btn: document.getElementById("add-child"),
			add_value_btn: document.getElementById("add-value"),
			edit_input_btn: document.getElementById("edit-input-btn"),
			search_component_btn: document.getElementById("search-component"),
			select_super_obj_btn: document.getElementById("select-super-obj")
		};

		this.ui_elements.import_json.onchange = function() {
			for(let i = 0; i < this.files.length; i++) {
				app.loadFile(this.files[i], i, this.files.length);
			}
		};
		this.ui_elements.download_json.onclick = function() {
			let l_s = new LoadingWindow(document.body).create();

			if(app.tab_manager.hasTabs()) {
				let tab = app.tab_manager.getSelectedTab();
				let obj = app.module_system.modify(tab.editor.file_type, tab.getObj());
				app.download(tab.getName(), JSON.stringify(obj, null, "\t"));
			}

			l_s.destroy();
		};

		this.ui_elements.add_child_btn.onclick = function() {
			let key = document.getElementById("add-child-input").childNodes[5].childNodes[0].value;
			if(key != "") {
				let editor = app.tab_manager.getSelectedTab().editor;
				editor.tree_manager.addObj(encodeHTML(key), editor.path.getCurrentContext());
			}
		};
		this.ui_elements.add_value_btn.onclick = function() {
			let value = document.getElementById("add-value-input").childNodes[5].childNodes[0].value;
			if(value != "") {
				let editor = app.tab_manager.getSelectedTab().editor;
				editor.tree_manager.addValue(encodeHTML(value), editor.path.getCurrentContext());
			}
		};
		this.ui_elements.edit_input_btn.onclick = function() {
			let edit_txt = document.getElementById("edit-input-div").childNodes[5].childNodes[0].value;
			let editor = app.tab_manager.getSelectedTab().editor;
			let edit_node = editor.path.getCurrentContext();
			
			edit_node.innerHTML = encodeHTML(edit_txt) + app.parser.btn;
			editor.tree_manager.updateEvents(edit_node);
		};

		this.ui_elements.search_component_btn.onclick = function() {
			app.documentation.openDocumentation();
		};
		this.ui_elements.select_super_obj_btn.onclick = function() {
			let editor = app.tab_manager.getSelectedTab().editor;
			editor.tree_manager.unselectElement();
			editor.auto_completions.forceUpdate();
			editor.auto_completions.updateInputs();
		};

		window.onresize = function(e) {
			document.body.style.height = window.innerHeight + "px";
			document.getElementById("editor").style.height = window.innerHeight - 312 + "px";
		};
	}

	expandAll() {
		let loading_window = new LoadingWindow().create();
		
		let details = document.querySelectorAll("details");
		for(let i = 0; i < details.length; i++) {
			if(!details[i].getAttribute("open")) details[i].setAttribute("open", true);
		}
	
		loading_window.destroy();
	}

	collapseAll() {
		let loading_window = new LoadingWindow().create();
	
		let details = document.querySelectorAll("details");
		for(let i = 0; i < details.length; i++) {
			details[i].removeAttribute("open");
		}
	
		loading_window.destroy();
	}
}

class LoadingScreen extends Screen {
	constructor(pParent) {
		super(pParent, "<div class='center blue-section'><h1>Loading data</h1><div class='loading-outer center'><div class='loading-inner'></div></div><h5>We are preparing your<br> new JSON Experience!</h5><p></p></div>");
	}
}

//Windows
class ScreenElement {
	/**
	 * @param {Node} pParent The node parent of this element
	 * @param {String} pNodeType The node type to create
	 * @param {String} pNodeName The property name of the node (default: node)
	 */
	constructor(pParent, pNodeType, pNodeName="node") {
		this.parent = pParent;
		this.node_name = pNodeName;

		this[this.node_name] = document.createElement(pNodeType);
		this[this.node_name].js_element = this;
		this.hidden = false;
	}
	/**
	 * Adds the ScreenElement to the context where it is defined
	 */
	create() {
		this.parent.appendChild(this[this.node_name]);
		return this;
	}
	/**
	 * Removes the ScreenElement from the context where it is defined
	 */
	destroy() {
		this.parent.removeChild(this[this.node_name]);
		return this;
	}

	/**
	 * Shows ScreenElement
	 */
	show() {
		this.hidden = false;
		this[this.node_name].style.display = "block";
		return this;
	}
	/**
	 * Hides ScreenElement
	 */
	hide() {
		this.hidden = true;
		this[this.node_name].style.display = "none";
		return this;
	}
	/**
	 * Toggles the visability of a ScreenElement
	 */
	toggle() {
		if(this.hidden) {
			return this.show();
		} else {
			return this.hide();
		}
	}

	/**
	 * Returns HTML of node
	 * @returns {String} HTML
	 */
	getHTML() {
		return this[this.node_name].outerHTML;
	}
	/**
	 * Returns node
	 * @returns {Node} node
	 */
	getNode() {
		return this[this.node_name];
	}
}

class PriorityScreenElement extends ScreenElement {
	constructor(pParent, pNodeType, pNodeName="node") {
		super(pParent, pNodeType, pNodeName);
	}
	/**
	 * Adds the popup window to the context where it is defined
	 */
	create() {
		//PriorityScreenElements need to be first child
		this.parent.insertBefore(this[this.node_name], this.parent.firstChild);
		return this;
	}
}

class PopUpWindow extends PriorityScreenElement {
	/**
	 * Create a new PopUpWindow
	 * @param {String} pId The unique ID of a popup window
	 * @param {Number} pW Width of window
	 * @param {Number} pH Height of window
	 * @param {Node} pParent The node parent of the popup window
	 * @param {String} pContent HTML Content for the popup window
	 * @param {Boolean} pHasCloseButton Whether the dialog shall have a close button
	 * @param {Boolean} pShowInnerBtn Whether the close button is inside the window
	 * @param {String} pOverflow Scrolling mode. Can be auto, scroll or hidden
	 */
	constructor(pId, pW, pH, pParent, pContent, pHasCloseButton=true, pShowInnerBtn=false, pOverflow="auto") {
		super(pParent, "DIV");

		//Outer DIV - blend background
		this.node.id = "popup-" + pId;
		this.node.classList.add("blend-full-screen");
		//Inner DIV - actual frame
		this.inner_div = document.createElement("DIV");
		this.inner_div.classList.add("section", "popup-inner-frame");
		this.inner_div.innerHTML = pContent;
		this.inner_div.style.overflowY = pOverflow;
		this.inner_div.style.width = pW;
		this.inner_div.style.setProperty("--window-height", pH);

		//Close Button
		if(pHasCloseButton) {
			this.btn = new CloseButton(this.node).getNode();

			//Building window
			if(pShowInnerBtn) {
				this.btn.classList.add("inner");
				this.inner_div.appendChild(this.btn);
			} else {
				this.node.insertBefore(this.btn, this.node.firstChild);
			}
		}

		this.node.appendChild(this.inner_div);
	}

	create() {
		super.create();
		if(this.btn) this.btn.focus();
		return this;
	}
}

class LoadingWindow extends PopUpWindow {
	constructor() {
		let loading_animation = "<div class='loading-outer center'><div class='loading-inner'></div></div>";
		super("loading", "40%", "102px", document.body, loading_animation, false, false, "hidden");
	}
}

class PushMessage extends PriorityScreenElement {
	/**
	 * @param {Node} pParent The parent node (context of the push message)
	 * @param {String} pContent The text to show in the push message
	 */
	constructor(pParent, pContent) {
		super(pParent, "DIV");

		//Outer DIV - blend background
		this.node.classList.add("push-message");
		//Inner DIV - actual frame
		this.inner_div = document.createElement("DIV");
		this.inner_div.classList.add("push-message-frame");
		this.inner_div.innerHTML = pContent;
		//Close Button
		this.btn = new CloseButton(this.node).getNode();
		this.btn.classList.add("btn-xs");
		//Building window
		this.btn.classList.add("inner")
		this.inner_div.appendChild(this.btn);
		
		this.node.appendChild(this.inner_div);
	}
}


//Buttons
class ActionButton extends ScreenElement {
	/**
	 * 
	 * @param {Node} pParent The button's parent HTML element
	 * @param {String} pText Text to show on the button (can be HTML)
	 * @param {Function} pAction Function to call onclick
	 */
	constructor(pParent, pText="undefined") {
		super(pParent, "BUTTON", "btn");
		this.btn.parent = pParent;
		this.parent = pParent;

		this.btn.classList.add("btn", "btn-outline-primary", "inline-element");
		this.btn.innerHTML = pText;
		this.btn.onclick = this.onclick;
	}

	onclick() {
		console.log("Button clicked!");
	}
	create() {
		super.create();
		this.btn.onclick = this.onclick;
	}
}

class CloseButton extends ActionButton {
	/**
	 * @param {Node} pParent The button's parent HTML element
	 * @param {String} pText Text to show on the button (can be HTML)
	 */
	constructor(pParent, pText="<i class='fa fa-remove'></i>") {
		super(pParent, pText);

		this.btn.classList.add("close-popup-window");
	}

	onclick() {
		this.parent.js_element.destroy();
		app.tab_manager.getSelectedElement().focus();
	}
}

//Lists
class List extends ScreenElement {
	constructor(pParent) {
		super(pParent, "UL", "n_list");
		this.list_elements = [];
	}

	addElement(pContent) {
		let element = new ListElement(this.n_list, pContent);
		element.create();
		if(this.list_elements.length == 0) {
			element.select(undefined, element.list_element, false, false, false);
		}
		this.list_elements.push(element);
	}

	addArray(pArr, pSearch="", pReset=true, pArrArg=[]) {
		if(pReset) {
			this.n_list.innerHTML = "";
			this.list_elements = [];
		}
		
		for(let i = 0; i < pArr.length; i++) {
			if((typeof pArr[i].key != "string" || pArr[i].key.contains(pSearch)) && !pArrArg.contains(pArr[i].key)) {
				let element = new ListElement(this.n_list, pArr[i].key)
				element.create();

				if(this.list_elements.length == 0) {
					element.select(undefined, element.list_element, false, false, false);
				}
				this.list_elements.push(element);
			}
		}
	}
	addDefaultArray(pArr, pSearch="", pReset=true) {
		if(pReset) {
			this.n_list.innerHTML = "";
			this.list_elements = [];
		}
		
		for(let i = 0; i < pArr.length; i++) {
			if(pArr[i].contains(pSearch)) {
				let element = new ListElement(this.n_list, pArr[i])
				element.create();

				if(this.list_elements.length == 0) {
					element.select(undefined, element.list_element, false, false, false);
				}
				this.list_elements.push(element);
			}
		}
	}

	getSelectedValue() {
		for(let i = 0; i < this.list_elements.length; i++) {
			if(this.list_elements[i].selected) {
				return this.list_elements[i].list_element.innerText;
			}
		}
	}

	/**
	 * Removes "selected-li" class from all childs
	 */
	removeSelected() {
		for(let i = 0; i < this.list_elements.length; i++) {
			this.list_elements[i].unselect();
		}
	}

	selectNext() {
		for(let i = 0; i < this.list_elements.length; i++) {
			if(this.list_elements[i].selected) {
				this.list_elements[i].unselect();

				if(i+1 == this.list_elements.length) i = -1;
				this.list_elements[i+1].select(undefined, this.list_elements[i+1].list_element, false, false);
				return undefined;
			}
		}
	}
	selectPrevious() {
		for(let i = 0; i < this.list_elements.length; i++) {
			if(this.list_elements[i].selected) {
				this.list_elements[i].unselect();

				if(i == 0) i = this.list_elements.length;
				this.list_elements[i-1].select(undefined, this.list_elements[i-1].list_element, false, false);
				return undefined;
			}
		}
	}
}
class ListElement extends ScreenElement {
	constructor(pParent, pContent) {
		super(pParent, "LI", "list_element");
		this.list_element.innerHTML = pContent;
		this.list_element.tabIndex = -1;
		this.selected = false;

		this.list_element.onclick = this.select;
	}
	
	/**
	 * Selects this ListElement
	 * @param {Event} pE Event handed over
	 * @param {*} pSelf Context
	 */
	select(pE, pSelf=this, pRemoveSelected=true, pFillInput=true, pFocus=true) {
		let dd = pSelf.js_element.parent.js_element.parent.js_element;

		if(!pSelf.js_element.selected) {
			if(pRemoveSelected) pSelf.js_element.parent.js_element.removeSelected();
			pSelf.js_element.selected = true;
			pSelf.classList.add("selected-li");
			pSelf.scrollIntoView();

			//Reselect button
			if(pFocus) dd.input.focus();
		} 

		if(dd.input.tagName == "INPUT" && pFillInput) {
			dd.fillInput(pSelf.innerText);
		}
	}

	/**
	 * Unselects this ListElement
	 */
	unselect(pSelf=this) {
		if(pSelf.selected) {
			pSelf.list_element.classList.remove("selected-li");
			pSelf.selected = false;
		}
	}
}

//Dropdowns
class DropDown extends ScreenElement {
	constructor(pParent, pInputType="button", pType="auto", pText="undefined") {
		super(pParent, "SPAN", "drop_wrapper");

		this.type = pType;

		//Self
		this.drop_wrapper.classList.add("dropdown");

		//TOGGLE BUTTON
		this.initInput(pInputType, pText);

		//LIST
		this.list = new List(this.drop_wrapper);
		this.list.hide();
		this.list.n_list.classList.add("section", "dropdown-content");
		this.list.create();

		this.array = [];
	}

	initInput(pInputType, pText) {
		this.input = document.createElement(pInputType);
		this.input.classList.add("dropdown-button", "section", "inline-element", "inline-button");
		if(pInputType == "button") {
			this.input.classList.add("btn", "btn-outline-primary");
			this.input.innerHTML = pText;

			this.input.onclick = function() {
				let list = this.parentElement.js_element.list;
				if(list.list_elements.length != 0) {
					list.toggle();
					list.n_list.focus();
				}
			};
		} else {
			this.input.classList.add("auto-suggestions");
			this.input.onclick = function() {
				this.setSelectionRange(0, this.value.length);

				let list = this.parentElement.js_element.list;
				if(list.list_elements.length != 0) {
					list.toggle();
					list.n_list.focus();
				}
			}
		}

		this.input.onblur = function(e) {
			if(e.relatedTarget && e.relatedTarget.tagName == "LI") {
				e.preventDefault();
			} else {
				this.parentElement.js_element.list.hide();
			}
		};
		this.input.onkeydown = function(e) {
			if(e.key == "ArrowDown") {
				e.preventDefault();
				this.parentElement.js_element.list.selectNext();
				this.scrollIntoView();
			} else if(e.key == "ArrowUp") {
				e.preventDefault();
				this.parentElement.js_element.list.selectPrevious();
				this.scrollIntoView();
			} else if(e.key == "Enter") {
				this.parentElement.js_element.onEnter();
			} else if(e.key == "Tab") {
				e.preventDefault();
				this.parentElement.js_element.fillInput(this.parentElement.js_element.list.getSelectedValue());
			} else if(this.parentElement.js_element.type != "auto" && this.tagName == "INPUT") {
				this.parentElement.js_element.propose(this.value);
			}
		};

		this.drop_wrapper.appendChild(this.input);
	}

	onEnter() {
		if(this.input.tagName == "INPUT") {
			if(window.getSelection().toString() == this.input.value && this.input.value != "") {
				if(this.type == "auto") {
					this.drop_wrapper.parentElement.childNodes[3].click();
				} else {
					this.drop_wrapper.parentElement.childNodes[27].click();
				}
				
			} else if(this.list.getSelectedValue() != undefined) {
				this.fillInput(this.list.getSelectedValue());
			} else {
				this.input.setSelectionRange(0, this.input.value.length);
			}
		}
		return this;
	}

	fillInput(pValue) {
		this.input.value = pValue;
		this.input.setSelectionRange(0, this.input.value.length);
		return this;
	}

	propose(pSearch, pArr, pReset=false) {
		if(this.array.length == 0 || pReset) this.array = pArr;
		this.list.addDefaultArray(this.array, pSearch);
		return this;
	}
}

/* CONFIRMATION WINDOW */
class ConfirmationWindow extends PriorityScreenElement {
	constructor(pParent, pContent, pW, pH, pOnConfirm, pOnCancel, pOnClose, pConfirmText="Confirm", pCancelText="Cancel") {
		super(pParent, "DIV", "node");
		this.node.classList.add("blend-full-screen");

		this.inner_div = document.createElement("DIV");
		this.inner_div.classList.add("section", "popup-inner-frame");
		this.inner_div.innerHTML = "<div>" + pContent + "</div>";
		this.inner_div.style.width = pW;
		this.inner_div.style.setProperty("--window-height", pH);
		this.inner_div.firstElementChild.style.setProperty("margin-bottom", "20px");

		this.confirm_btn = document.createElement("BUTTON");
		this.confirm_btn.classList.add("btn", "btn-outline-primary", "inline-element");
		this.confirm_btn.innerText = pConfirmText;
		this.confirm_btn.js_parent = this;
		this.confirm_btn.style.setProperty("margin-right", "10px");
		this.cancel_btn = document.createElement("BUTTON");
		this.cancel_btn.classList.add("btn", "btn-outline-primary", "inline-element");
		this.cancel_btn.innerText = pCancelText;
		this.cancel_btn.js_parent = this;

		this.close_btn = new CloseButton(this.node).getNode();
		this.close_btn.classList.add("inner");
		this.close_btn.js_parent = this;

		//EVENTS
		this.confirm_btn.onclick = function() {
			this.js_parent.destroy();
			app.tab_manager.getSelectedElement().focus();
			if(pOnConfirm) pOnConfirm();
		};
		this.cancel_btn.onclick = function() {
			this.js_parent.destroy();
			app.tab_manager.getSelectedElement().focus();
			if(pOnCancel) pOnCancel();
		};
		this.close_btn.onclick = function() {
			this.js_parent.destroy();
			app.tab_manager.getSelectedElement().focus();
			if(pOnClose) pOnClose();
		};

		this.node.appendChild(this.inner_div);
		this.inner_div.appendChild(this.confirm_btn);
		this.inner_div.appendChild(this.cancel_btn);
		this.inner_div.appendChild(this.close_btn);
	}

	create() {
		super.create();
		this.confirm_btn.focus();
		this.confirm_btn.onkeydown = function(e) {
			if(e.key == "ArrowRight" || e.key == "ArrowLeft") this.js_parent.cancel_btn.focus();
		}
		this.cancel_btn.onkeydown = function(e) {
			if(e.key == "ArrowLeft" || e.key == "ArrowRight") this.js_parent.confirm_btn.focus();
		}
		return this;
	}
}