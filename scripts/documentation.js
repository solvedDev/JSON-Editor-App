/**
 * SCRIPTS FOR PROVIDING THE DOCUMENTATION SEARCH FUNCTIONALITY
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class Documentation {
	constructor(pApp) {
		this.app = pApp;
		this.documentation_parser = this.app.documentation_parser;
		this.data = this.getData();
		this.data.components["minecraft:interact"].particle_on_start.description = "Particle effect that will be triggered at the start of the interaction\n<table border=\"1\">\n<tbody><tr> <th>Name</th> <th>Type</th> <th>Default Value</th> <th>Description</th> </tr>\n<tr>\n<td>particle_offset_towards_interactor</td>\n<td>Boolean</td>\n<td></td>\n<td>Whether or not the particle will appear closer to who performed the interaction</td>\n</tr><tr>\n<td>particle_type</td>\n<td>String</td>\n<td></td>\n<td>The type of particle that will be spawned</td>\n</tr><tr>\n<td>particle_y_offset</td>\n<td>Decimal</td>\n<td></td>\n<td>Will offset the particle this amount in the y direction</td>\n</tr>\n</tbody></table>";

		//Add search-bar
		this.search_bar = new DropDown(document.getElementById("toolbar"), "INPUT", "search").create();
		this.search_bar.propose("", this.documentation_parser.getDocumentation("component_names"));
	}

	addComponents(pComponents) {
		this.documentation_parser.addComponents(pComponents);
		this.search_bar.propose("", this.documentation_parser.getDocumentation("component_names"), true);
	}

	getSearchList() {
		return this.search_bar.list.n_list;
	}
	getData() {
		return this.documentation_parser.getDocumentation();
	}

	/**
	 * Opens a new documentation window
	 * @param {String} pPage The page to open (e.g. component@minecraft:interact)
	 */
	openDocumentation() {
		let doc_to_open = this.findPage(this.search_bar.input.value);
		let documentation_text = "";

		if(doc_to_open.split("@")[1] != "do_not_open") {
			//BUILD COMPONENT PAGE
			if(doc_to_open.split("@")[0] == "component") {
				doc_to_open = doc_to_open.split("@")[1];

				documentation_text += "<h4>" + doc_to_open + "</h4>";

				let component =  this.data.components[doc_to_open];
				documentation_text += "<p>" + component.__des__ + "</p><br>";

				if(Object.keys(component).length > 1) {
					documentation_text += "<h5>Arguments</h5>";
					documentation_text += "<ul>";
					if(doc_to_open.includes("behavior")) {
						documentation_text += behavior_arguments;
					}
					for(let argument in component) {
						if(argument != "__des__") {
							let default_value = "";
							if(component[argument].default_value != "") default_value = " (Default: " + component[argument].default_value + ")";

							documentation_text += "<li><span style='font-weight: bold; text-decoration: underline;'>" + argument 
							+ "</span> <span class='highlight-" + convertType(component[argument].type) + "'>[" + component[argument].type + "]</span>: " 
							+ component[argument].description.replace(/<a[^>]*>/g, "").replace(/Back to top/g, "") + default_value + "</li>".replace(/\n/g, "");
						}
					}
					documentation_text += "</ul>";
				} else if(doc_to_open.includes("behavior")) {
					documentation_text += "<h5>Arguments</h5><ul>" + behavior_arguments + "</ul>";
				}
			} else if(doc_to_open.split("@")[0] == "event") {
				doc_to_open = doc_to_open.split("@")[1];
				documentation_text += "<h4>" + doc_to_open + "</h4>";

				let event =  this.data.events[doc_to_open];
				documentation_text += "<p>" + event.description + "</p>";
			} else {
				documentation_text += "<h4>minecraft:" + doc_to_open.split("@")[1] + "</h4>";

				documentation_text += "<p>" + "A minecraft " + doc_to_open.split("@")[0] + "</p>";
			}

			new PopUpWindow("documentation", "90%", "90%", document.body, documentation_text, true, true).create();
		}
	}

	findPage(pSearch, pDoSecondTest=false) {
		let doc_to_open = "component@" + this.getValidSearch(pSearch, "components", pDoSecondTest);
		if(doc_to_open == "component@do_not_open") {
			doc_to_open = "block@" + this.getValidSearch(pSearch, "blocks", pDoSecondTest);

			if(doc_to_open == "block@do_not_open") {
				doc_to_open = "item@" +  this.getValidSearch(pSearch, "items", pDoSecondTest);

				if(doc_to_open == "item@do_not_open") {
					doc_to_open = "entity@" +  this.getValidSearch(pSearch, "entities", pDoSecondTest);

					if(doc_to_open == "entity@do_not_open") {
						doc_to_open = "event@" +  this.getValidSearch(pSearch, "events", pDoSecondTest);
					}
				}
			}
		}
		if(doc_to_open.split("@")[1] == "do_not_open" && !pDoSecondTest) doc_to_open = this.findPage(pSearch, true);
		console.log(doc_to_open);
		return doc_to_open;
	}

	getValidSearch(pSearch, pSection, pDoSecondTest=false) {
		let data_list = this.getSearchList();
		if(pSection == "components") {
			if(pSearch in this.data["components"]){
				return pSearch;
			} else if (pDoSecondTest && data_list.length > 0 && data_list[0].innerText in this.data["components"]) {
				return data_list[0];
			} else {
				return "do_not_open"
			}
		} else if(pSection == "events") {
			if(pSearch in this.data["events"]){
				return pSearch;
			} else if (pDoSecondTest && data_list.length > 0 && data_list[0].innerText in this.data["events"]) {
				return data_list[0];
			} else {
				return "do_not_open"
			}
		} else {
			if(this.data[pSection].indexOf(pSearch) > -1){
				return pSearch;
			} else if (data_list.length > 0 && this.data[pSection].indexOf(data_list[0].innerText) > -1) {
				return data_list[0];
			} else {
				return "do_not_open"
			}
		}
	}
}


//Manual fix for minecraft:interact
var behavior_arguments = "<li><span style='font-weight: bold; text-decoration: underline;'>priority</span> <span class='highlight-number'>[Integer]:</span> Tells the entity which behavior has priority. A smaller number correlates to a higher priority</li>";