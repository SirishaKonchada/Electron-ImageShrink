const path =  require('path')
const os = require('os')
const {app,BrowserWindow,Menu,globalShortcut, shell, ipcMain} = require('electron')
const imagemin = require('imagemin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')
const slash = require('slash')
const imageminMozjpeg = require('imagemin-mozjpeg')
const { default: imageminPngquant } = require('imagemin-pngquant')
const log = require('electron-log')

let mainWindow,aboutWindow

process.env.NODE_ENV = 'development'

const isDev = process.env.NODE_ENV !== 'production' ? true : false 
const isWin = process.platform === 'win32' ? true : false
const isMac = process.platform === 'darwin' ? true : false

console.log(process.platform)

function createWindow() {
    mainWindow = new BrowserWindow({
        title : 'Image Shrink',
        minWidth : 1000,
        minHeight : 400,
        icon : `${__dirname}/assets/icons/Icon_256*256.png`,
        resizable : isDev ? true : false,
        backgroundColor : 'white',
        webPreferences : {
            nodeIntegration : true
        }
    })

    if(isDev)
    mainWindow.webContents.openDevTools();

   // mainWindow.loadURL('https://twitter.com')
  // mainWindow.loadURL(`file://${__dirname}/app/index.html`)
   mainWindow.loadFile('./app/index.html')
}

function createAboutWindow() {
    aboutWindow = new BrowserWindow({
        title : 'About Image Shrink',
        minWidth : 300,
        minHeight : 300,
        icon : `${__dirname}/assets/icons/Icon_256*256.png`,
        resizable : isDev ? true : false,
        backgroundColor : 'white',
        webPreferences : {
            nodeIntegration : true
        }
    })

   // mainWindow.loadURL('https://twitter.com')
  // mainWindow.loadURL(`file://${__dirname}/app/index.html`)
   aboutWindow.loadFile('./app/about.html')
}


app.on('ready', ()=>{
    createWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu)

    globalShortcut.register('Ctrl+R', () => mainWindow.reload() )  //reloads entire application
    globalShortcut.register('Ctrl+Shift+I', () => mainWindow.toggleDevTools() )  
    mainWindow.on('closed',()=>{mainWindow = null})
})

const menu = [
    ...(isMac ? [{role : 'appMenu'}] : []),
    ...(isDev ? [{
        label : app.name,
        submenu : [
            {
                label : 'About',
                click : createAboutWindow
            }
        ]
    }] :[] ),
    {
    label : 'File',
    submenu : [
       { role : 'cut'},
       {role : 'paste'}
    ]
},
{
    label : 'Developer',
    submenu : [
        {role : 'seperator'},
        { role : 'reload'},
        {role : 'forcereload'}
    ]
},
{
   /* label : 'view',
    submenu : [{
        label : 'Quit   ',
        accelerator : 'Ctrl+W', // defines shortcut
        click : ()=> app.quit()
    }]*/
    role : 'fileMenu'
}]

if(isMac)
{
    menu.unshift({ role : 'appMenu'})
}

ipcMain.on('image:minimize', (e, options) =>{
    //console.log(options)
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options)
})

async function shrinkImage({ imgPath , quality, dest }) {
    try{
        const pngQuality = quality/100
        const files = await imagemin([slash(imgPath)], {
            destination : dest,
            plugins : [
                imageminMozjpeg({quality}),
                imageminPngquant({
                    quality : [pngQuality, pngQuality] 
                })
            ]
        })
        console.log(files)
       // shell.openItem(dest)

        mainWindow.webContents.send('image:done')


    }
    catch(err){
        //console.log(err)
        log.error(err)
    }
}

app.on('windows-all-closed',()=>{
    if(!isWin){
        app.quit()
    }
})

app.on('activate',()=>{
    if(BrowserWindow.getAllWindows.length === 0){
        createWindow()
    }
})