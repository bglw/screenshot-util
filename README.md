# screenshot-util

## Example Usage:
`node example.js https://twitchcon.com`  
`node example.js https://cloudcannon.com`  
`node example.js https://devices.netflix.com`  

## Screenshotter Usage:

```javascript
const Screenshotter = require('./screenshotter.js');

let screenshotter = new Screenshotter({
    screenSize: {width: 1920, height: 1080},
    fullPage: false,
    base64: true
})

async function go(url) {
    let img = await screenshotter.takeScreenshot(url);
    // do something with img
    screenshotter.end();
}
go("https://miniclip.com");

screenshotter.launch();
```

```javascript
const Screenshotter = require('./screenshotter.js');

let screenshotter = new Screenshotter({
    screenSize: {width: 1920, height: 1080},
    fullPage: false,
    base64: true
})

async function go(path) {
    let url = await screenshotter.serve(path);
    let img = await screenshotter.takeScreenshot(url);
    // do something with img
    screenshotter.shutdownBrowser();
    screenshotter.shutdownServer();
}
go("/site/dist/");

screenshotter.launch();
```

### Docker Step:
`node docker-step.js /input/path/ /output/path/`  
Outputs *image.png*

## Main methods:
`launch()`  
Starts up puppeteer  
  
`serve(path)`  
Starts an express server on a free port and returns the url  
  
`takeScreenshot(url)`  
Opens given URL in puppeteer and returns a screenshot as either base64 or binary  

## Constructor Options
Option | Default | Description
--- | --- | ---
screenSize | {width: 1920, height: 1080} | Size of viewport
fullPage | false | Whether to render the full height of the page, or just the viewport
base64 | false | Return base64 data, or binary
url | "https://cloudcannon.com" | Default URL if none specified to takeScreenshot()

## TODO
- i18n coverage
- i18n reporting
- Colorblind / screenreader overlays
- Named device sizes
- JPEG flag
- Lighthouse auditing
