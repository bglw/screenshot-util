const Screenshotter = require('./screenshotter.js');
const fs = require("fs");

let screenshotter = new Screenshotter({
    screenSize: {width: 1920, height: 1080},
    fullPage: false,
    base64: false
})

async function go(url, path) {
    let dest_url = url;
    if (path) {
        url = await screenshotter.serve(path);
        dest_url = dest_url.replace(/^https?:\/\/.+?(\/|$)/, url);
    }
    let img = await screenshotter.takeScreenshot(dest_url);
    fs.writeFile('image.png', img, (error) => {});
    screenshotter.shutdownBrowser();
    screenshotter.shutdownServer();
}
go(process.argv[2], process.argv[3]);

screenshotter.launch();