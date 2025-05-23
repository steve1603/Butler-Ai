const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

// Ensure data directory exists
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Initialize data files
const tasksFile = path.join(dataPath, 'tasks.json');
if (!fs.existsSync(tasksFile)) {
  fs.writeFileSync(tasksFile, '[]');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Position window in bottom right
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(width - 420, height - 620);
  
  // Dev tools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray() {
  // Create a 1x1 transparent image for tray icon (placeholder)
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    // Create a simple icon file
    const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    fs.writeFileSync(iconPath, Buffer.from(iconBase64, 'base64'));
  }
  
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Butler', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('Butler AI Assistant');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

// IPC Handlers
ipcMain.handle('get-tasks', () => {
  try {
    const data = fs.readFileSync(tasksFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tasks:', error);
    return [];
  }
});

ipcMain.handle('save-tasks', (event, tasks) => {
  try {
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow.hide();
});

ipcMain.on('close-window', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

