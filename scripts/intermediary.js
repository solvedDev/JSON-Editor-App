var electron = require("electron");
const {ipcRenderer} = electron;
const fs = require("fs");
let l_s;

//MAIN WINDOW BTNS
const close_btn = document.getElementById("close");
close_btn.onclick = function(e){
	ipcRenderer.send("close-mainWindow");
};
const min_btn = document.getElementById("minimize");
min_btn.onclick = function(e){
	ipcRenderer.send("minimize-mainWindow");
};
const max_btn = document.getElementById("maximize");
max_btn.onclick = function(e){
	ipcRenderer.send("maximize-mainWindow");
};

//OPEN FILES
const open_btn = document.getElementById("import-json");
open_btn.type = "button";
open_btn.onclick = function(e){
	ipcRenderer.send("openFileDialog");
};
ipcRenderer.on("filePaths", function(pEvent, pPaths) {
	if(pPaths) {
		l_s = new LoadingWindow(document.body).create();
		for(let i = 0; i < pPaths.length; i++) {
			fs.readFile(pPaths[i], 'utf8', fileLoaded);
	
			function fileLoaded(pError, pData) {
				if(pError) console.warn(pError);
				try {
					app.tab_manager.addTab(pPaths[i].split("\\").pop(), JSON.parse(JSON.minify(pData)), pPaths.length, pPaths[i]);
				} catch(e) {
					console.warn("An error occurred while trying to open the file \"" + pPaths[i].split("\\").pop() + "\": ");
					console.log(e);
					new PushMessage(document.body, "Invalid JSON!").create();
				}
				if(i+1 == pPaths.length) l_s.destroy();
			}
		}
	}
});

//SAVE BTN
const download_btn = document.getElementById("download-json");
download_btn.innerHTML = "<i class='fa fa-save'></i> Save";
download_btn.onclick = function(e){
	l_s = new LoadingWindow(document.body).create();

	if(app.tab_manager.hasTabs()) {
		let tab = app.tab_manager.getSelectedTab();
		let path = tab.path;
		if(path == undefined) {
			ipcRenderer.send("saveFileDialog", tab.getName());
		} else {
			let obj = app.module_system.modify(tab.editor.file_type, tab.getObj());
			save(path, JSON.stringify(obj, null, "\t"))
		}
	}
};
ipcRenderer.on("savePath", function(pEvent, pPath) {
	if(pPath != undefined) {
		let tab = app.tab_manager.getSelectedTab();
		let obj = app.module_system.modify(tab.editor.file_type, tab.getObj());

		tab.path = pPath;
		save(tab.path, JSON.stringify(obj, null, "\t"));
	} else {
		l_s.destroy();
	}
});
function save(pPath, pData) {
	fs.writeFile(pPath, pData, function() {
		l_s.destroy();
	});
}

//OPEN PROJECT
let open_project = document.getElementById("open-project-folder-btn");
open_project.onclick = function(){
	ipcRenderer.send("openDirDialog");
};
ipcRenderer.on("dirPath", function(pEvent, pPath) {
	if(pPath != undefined) {
		if(app.config.project_path != pPath[0]) {
			app.config.project_path = pPath[0];
			app.updateConfig();
		}
		renderProject(pPath[0]);
	}
});
function renderProject(pPath) {
	let sidebar = document.querySelector("sidebar");
	sidebar.innerHTML = "<div class='up section center-text' style='margin-bottom: 5px;'><h6>" + pPath.split("\\").pop() + "</h6><button id='open-project-folder-btn' class='btn btn-outline-primary btn-sm'>New</button></div>";
	sidebar.innerHTML += "<ul></ul>";

	let files = getFilesInDir(pPath);
	let list = sidebar.firstElementChild.nextElementSibling;
	for(let i = 0; i < files.length; i++) {
		if(files[i].includes(".json")) {
			let e = document.createElement("LI");
			e.innerText = files[i].split(pPath)[1].slice(1);

			e.onclick = function() {
				if(!app.tab_manager.isFileOpen(files[i])) {
					l_s = new LoadingWindow(document.body).create();
					fs.readFile(files[i], 'utf8', fileLoaded);
					function fileLoaded(pError, pData) {
						if(pError) console.warn(pError);
						try {
							app.tab_manager.addTab(e.innerText, JSON.parse(JSON.minify(pData)), 1, files[i]);
						} catch(e) {
							console.warn("An error occurred while trying to open the file \"" + e.innerText + "\": ");
							console.log(e);
							new PushMessage(document.body, "Invalid JSON!").create();
						}
						l_s.destroy();
					}
				} else {
					app.tab_manager.getTabByPath(files[i]).enable();
				}
			}

			list.appendChild(e);
		}
	}
	sidebar.querySelector("button").onclick = function(){
		ipcRenderer.send("openDirDialog");
	};
}
function getFilesInDir(pDir, pFiles=[]){
    let files = fs.readdirSync(pDir);
    for (let i in files){
		if(typeof files[i] != "function") {
			let name = pDir + "\\" + files[i];
			if (fs.statSync(name).isDirectory()){
				getFilesInDir(name, pFiles);
			} else {
				pFiles.push(name);
			}
		}
    }
    return pFiles;
}

module.exports = {
	renderProject: renderProject
}