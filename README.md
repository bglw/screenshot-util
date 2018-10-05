# screenshot-util

`npm install screenshot-util`

## Screenshotter Usage:

```javascript
const Screenshotter = require('screenshot-util');

var screenshotter = new Screenshotter({
    dest: "screenshots",
    path: "dist/site",
    screenSize: {width: 1920, height: 1080},
    fullPage: true,
    docker: false,
    delay: 1000,
    portInc: 1
});

screenshotter.launch();

async function ss(urlPath) {
    await screenshotter.puppetCheck();
    let serverUrl = await screenshotter.serve();
    let page = await screenshotter.loadPage(serverUrl, urlPath, {
        name: "desktop",
        width: 1920,
        height: 1080
    });
    let img = await screenshotter.takeScreenshot(page);
    // do something with img
    await screenshotter.shutdownServer();
    await screenshotter.shutdownBrowser();
}
ss("index.html");
```