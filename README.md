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
    base64: false
})

async function go(url) {
    let img = await screenshotter.takeScreenshot(url);
    fs.writeFile('image.png', img, (error) => {});
    screenshotter.end();
}
go("https://miniclip.com");

screenshotter.launch();
```

## Constructor Options
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
