const electron = require("electron");
const url = require("url");
const path = require("path");
const fs = require("fs");

const {app, BrowserWindow, Menu, ipcMain} = electron;

//SET ENVIRONMENT
process.env.NODE_ENV = "dev-build";

let mainWindow;

function createWindow(){
	//Create a window
	mainWindow = new BrowserWindow({
		frame: false,
		icon: path.join(__dirname, "/img/icon.ico"),
		width: 950
	});
	
	//Load html to window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file:",
		slashes: true
	}));
	
	//Quit app when closed
	mainWindow.on("closed", function(){
		if(process.platform !== "darwin"){
			app.quit();
		}
	});
	
	//Build menu from template 
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	//Insert menu
	Menu.setApplicationMenu(mainMenu);
}

//APP
app.on("ready", createWindow);
app.on("activated", createWindow);

//CUSTOM FRAME
ipcMain.on("close-mainWindow", function(){
	mainWindow.close();
	if(process.platform !== "darwin"){
		app.quit();
	}
});
ipcMain.on("minimize-mainWindow", function(){
	mainWindow.minimize();
});
ipcMain.on("maximize-mainWindow", function(){
	mainWindow.maximize();
});
ipcMain.on("openFileDialog", function(){
	electron.dialog.showOpenDialog(undefined, {
		filters: [ { name: "text", extensions: ["json"] } ],
		title: "Select JSON file(s)",
		properties: ["openFile", "multiSelections"]
	}, chosenFile);

	function chosenFile(pPaths) {
		mainWindow.webContents.send("filePaths", pPaths);
	}
});
ipcMain.on("openDirDialog", function(){
	electron.dialog.showOpenDialog(undefined, {
		filters: [ { name: "text", extensions: ["json"] } ],
		title: "Select Directory",
		properties: ["openDirectory"]
	}, chosenDir);

	function chosenDir(pPath) {
		mainWindow.webContents.send("dirPath", pPath);
	}
});
ipcMain.on("saveFileDialog", function(pEvent, pName){
	electron.dialog.showSaveDialog(undefined, {
		filters: [ { name: "text", extensions: ["json"] } ],
		title: "Select Location",
		defaultPath: "~/" + pName
	}, chosenPath);

	function chosenPath(pPath) {
		mainWindow.webContents.send("savePath", pPath);
	}
});


//Create menu template
const mainMenuTemplate = [];

//Handle MAC menu
if(process.platform == "darwin"){
	mainMenuTemplate.unshift({});
}

//Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
	mainMenuTemplate.push({
		label: "Developer Tools",
		submenu: [
			{
				label: 'toggle DevTools',
				accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
				click(item, focusedWindow){
					focusedWindow.toggleDevTools();
				}
			},
			{
				role: "reload"
			}
		]
	});
}