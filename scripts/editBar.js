/**
 * FUNCTIONALITY OF EDIT_BAR
 * 
 * Status: Not in use
 * Creator: @solvedDev
 * Project: JSON Editor
 */

class EditBar extends ScreenElement {
	constructor() {
		super(document.querySelector(".edit-bar#object"), "DIV");
		this.add_child = new ButtonInput(this.node, "+", "Add child", "add-child");
		this.add_value = new ButtonInput(this.node, "+", "Add value", "add-value");
	}
	/**
	 * Overwrites default create of ScreenElement to also create the ButtonInput
	 */
	create() {
		super.create();
		this.add_child.create();
		this.add_value.create();
	}
}

class ButtonInput extends ScreenElement {
	/**
	 * @param {Node} pParent The parent of the ButtonInput
	 * @param {String} pButtonText Text on the button -can be HTML
	 * @param {String} pText Text in front of the button 
	 * @param {String} pButtonId Id of the button
	 */
	constructor(pParent, pButtonText, pText="", pButtonId="") {
		super(pParent, "DIV");
		this.node.classList.add("section", "input-button", "inline-element");

		if(pText != "") this.node.innerHTML = "<label for'" + pButtonId + "'>" + pText +"</label>";

		this.js_btn = new ActionButton(this.node, pButtonText);
		this.js_btn.btn.classList.add("input-button");
		this.js_btn.btn.id = pButtonId;

		this.js_input = new Input(this.node);
	}
	/**
	 * Overwrites default create of ScreenElement to also create the button & input
	 */
	create() {
		super.create();
		this.js_btn.create();
		this.js_input.create();
	}
}

class Input extends ScreenElement {
	/**
	 * @param {Node} pParent The parent of the Input
	 * @param {Boolean} pAutoSelect Whether the text inside should select on click
	 */
	constructor(pParent, pAutoSelect=true) {
		super(pParent, "INPUT", "input_node");
		this.input_node.setAttribute("type", "text");
		this.input_node.classList.add("section", "text-input");

		if(pAutoSelect) {
			this.input_node.onclick = function() {
				this.setSelectionRange(0, this.value.length);
			};
		}
	}
}