const { app, BrowserWindow, dialog, ipcMain, Tray, Menu } = require('electron');
const isDev = require('electron-is-dev');
const url = require("url");
const path = require("path");

let mainWindow;
let fileSelectDialogOpened = false;
const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false
  });
  mainWindow.setMenu(null);
  if (isDev) {
    //Open page served by Angular
    mainWindow.loadURL('http://127.0.0.1:4200');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, `/dist/video-motion-detector/index.html`),
        protocol: "file:",
        slashes: true
      })
    );
  }
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    ipcMain.on('selectFile', (event, arg) => {
      if(!fileSelectDialogOpened) {
        fileSelectDialogOpened = true;
        dialog.showOpenDialog(mainWindow, {
          extensions: ["mp4", "avi", "mov"],
          filters: [
            {
              "name": "Video files (mp4, mov, avi, mkv)",
              "extensions": ["mp4", "mov", "avi", "mkv"]
            },
            {
              "name": "All",
              "extensions": ["*"]
            },
        ]}).then((response) => {
          if(!response.canceled) event.reply('fileSelected', response.filePaths[0]);
          fileSelectDialogOpened = false;
        });
      }
    })
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    createWindow();
    
    //createTrayIcon();
  });

  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
