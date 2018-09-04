const Screenshotter = require('./screenshotter.js');
const fs = require("fs");

let screenshotter = new Screenshotter({
    screenSize: {width: 1920, height: 1080},
    fullPage: false,
    base64: false
})

async function go(url) {
    let img = await screenshotter.takeScreenshot(url);
    fs.writeFile('image.png', img, (error) => {});
    screenshotter.end();
}
go(process.argv[2]);

screenshotter.launch();