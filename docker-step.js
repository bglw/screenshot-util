const Screenshotter = require('./screenshotter.js');
const fs = require("fs");
const path = require('path');

let screenshotter = new Screenshotter({
    screenSize: {width: 1920, height: 1080},
    fullPage: false,
    base64: false
})

async function go(inputPath, outputPath) {
    url = await screenshotter.serve(inputPath);
    let img = await screenshotter.takeScreenshot(url);
    fs.writeFile(path.join(outputPath, 'image.png'), img, (error) => {});
    screenshotter.shutdownBrowser();
    screenshotter.shutdownServer();
}
go(process.argv[2], process.argv[3]);

screenshotter.launch();