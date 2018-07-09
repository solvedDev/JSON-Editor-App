/**
 * SCRIPTS FOR HIGHLIGHTING FUNCTIONALITY
 * [!!!] NOT IN USE BUT FULLY FUNCTIONAL
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class Highlighter {
	constructor(pConfig) {
		this.config = pConfig;

		this.initialLoad();
	}

	highlight(pElement) {
		let node = pElement;
		let parts = node.innerHTML.split("<button");
		let ht = parts[0].replace(/<highlight[^>]*>/g, "").replace(/<\/highlight[^>]*>/g, "");
		for(let key in this.config) {
			if(ht.includes(key)) {
				ht = ht.replace(new RegExp(key, "g"), "<highlight onclick='this.parentElement.click()' style='" + this.config[key] + "'>" + key + "</highlight>");
				parts[0] = ht;
				node.innerHTML = parts.join("<button");
				try {
					node.childNodes[node.childNodes.length-1].onclick = function(e) {
						removeElement(e.target.parentElement);
					};
				} catch(e) {
					console.warn("Unable to register onclick event: ");
					console.log(node);
				}
				
				return node;
			}
		}
		return node;
	}

	initialLoad() {
		let elements = editor.querySelectorAll("summary");

		for(var i = 0; i < elements.length; i++) {
			this.highlight(elements[i]);
			
		}
	}
}
