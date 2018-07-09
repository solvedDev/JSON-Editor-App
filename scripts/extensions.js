class ExtensionSystem {
	constructor(pApp, pExtensions) {
		this.app = pApp;
		this.extensions = pExtensions;

		this.installExtensions();
	}

	installExtensions() {
		for(let name in this.extensions) {
			this.installExtension(this.extensions[name]);
		}
	}

	installExtension(pExtension) {
		this.app.documentation.addComponents(pExtension.components.descriptions);
		this.app.module_system.addCustomComponents(pExtension.components.definitions);
	}
}