/**
 * COLLECTION OF UTILITIES
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

String.prototype.insert = function(pString, pIndex) {
	if (pIndex > 0)
	  return this.substring(0, pIndex) + pString + this.substring(pIndex, this.length);
	else
	  return pString + this;
};
String.prototype.contains = String.prototype.includes;

String.prototype.removeCharAtIndex = function(pIndex) {
	return this.substring(0, pIndex - 1) + this.substring(pIndex, this.length);
};
String.prototype.pathUp = function(pArg=1) {
	let arr = this.split("/");
	arr.splice(arr.length - pArg, pArg);
	return arr.join("/");
}

Array.prototype.contains = function(pValue) {
	return this.indexOf(pValue) > -1;
}
Array.prototype.containsObj = function(pArg, pValue) {
	for(let i = 0; i < this.length; i++) {
		if(this[i][pArg] == pValue) {
			return true;
		}
	}
	return false;
}

Array.prototype.removeStrings = function(pStrings) {
	if(Array.isArray(pStrings)) {
		for(let i = 0; i < pStrings.length; i++) {
			let index = this.indexOf(pStrings[i]);
			if (index !== -1) {
				this.splice(index, 1);
			}
		}
		return pStrings;
	} else {
		let index = this.indexOf(pStrings);
		if (index !== -1) {
			return this.splice(index, 1);
		}
	}
}

if(typeof Array.isArray !== 'function') {
	Array.isArray = function( arr ) {
		return Object.prototype.toString.call( arr ) === '[object Array]';
	};
}

function encodeHTML(pStr) {
    return String(pStr).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toggleEdits() {
	let edits = document.querySelectorAll(".highlight-array, .highlight-object, .highlight-string, .highlight-boolean, .highlight-number, span.value");

	edit_all = !edit_all;
	let display = document.getElementById("allow-edit");
	if(edit_all) {
		display.classList.add("toggled");
		display.innerText = "Edit all: ON"
	} else {
		display.classList.remove("toggled");
		display.innerText = "Edit all: OFF"
	}

	for(var i = 0; i < edits.length; i++) {
		edits[i].setAttribute("contenteditable", edit_all);
	}
}

function isInInput() {
	return document.activeElement.isSameNode(child_input) || document.activeElement.isSameNode(value_input) || document.activeElement.isSameNode(search_bar);
}

function convertType(pType) {
	if(pType.toLowerCase() == "string" || pType.toLowerCase() == "boolean") {
		return pType.toLowerCase();
	} else if(pType.toLowerCase() == "json object" || pType.toLowerCase() == "minecraft filter") {
		return "object";
	} else if(pType.toLowerCase() == "list" || pType.toLowerCase() == "range [a, b]" || pType.toLowerCase() == "vector [a, b, c]") {
		return "array";
	} else if(pType.toLowerCase() == "decimal" || pType.toLowerCase() == "integer") {
		return "number";
	} else {
		console.warn("Unhandled argument type: " + pType);
		return pType;
	}
}

function getContextType(pContext, pParentContext) {
	if(pContext in autoData["components"]) {
		return "object";
	} else if(pContext == "event" || pContext == "spawn_event") {
		return "event";
	} else if(parentCurrentContext == "component_groups" && !Number.isNaN(currentContext)) {
		return "component_group";
	} else if((pParentContext == "remove" || pParentContext == "add") && pContext == "component_groups") {
		return "array";
	} else if(pContext == "id" || pContext == "entity_type" || pContext == "into" || pContext == "babyType" || pContext == "spawn_entity") {
		return "entity";
	} else if(pContext == "target" || pContext == "subject") {
		return "subject";
	} else if(pParentContext.toLowerCase().includes("item") || (pContext.toLowerCase().includes("item") && (autoData["components"][pParentContext] == undefined || autoData["components"][pParentContext][pContext] == undefined || convertType(autoData["components"][pParentContext][pContext].type) == "string") &&  !pContext.toLowerCase().includes("items"))) {
		return "item";
	} else if(autoData["components"][pParentContext] != undefined && pContext in autoData["components"][pParentContext]) {
		return convertType(autoData["components"][pParentContext][pContext].type);
	} else {
		return "object";
	}
}

function getDefault(pContext, pParentContext) {
	try {
		if(pContext == "priority") return 0;
		return autoData["components"][pParentContext][pContext].default_value;
	} catch(e) {
		console.warn("Context \"" + pParentContext + "." + pContext + " has no default_value")
	}
}

function findSelf(pElements, pSelf) {
	let counter = 0;
	while(counter < pElements.length && !pElements[counter].isSameNode(pSelf)) {
		counter++;
	}
	if(counter < pElements.length) return counter;
	return undefined;
}