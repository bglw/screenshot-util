const puppeteer = require('puppeteer');
const express = require('express');
const fp = require("find-free-port");
const c = require('ansi-colors');
const timeout = ms => new Promise(res => setTimeout(res, ms));

function Screenshotter(options) {
    const defaults = {
        fullPage: false,
        url: "https://cloudcannon.com",
        screenSize: {width: 1920, height: 1080},
        base64: false
    }
    this.options = Object.assign({}, defaults, options);
}

Screenshotter.prototype.puppetLaunched = function () {
    return !!this.options.browser;
};

Screenshotter.prototype.puppetCheck = async function () {
    while (!this.puppetLaunched()) {
        await timeout(500);
        process.stdout.write(c.yellow(`.`));
    }
    console.log(c.greenBright("✓"));
    return;
};

Screenshotter.prototype.launch = function () {
    let screenshotter = this;
    puppeteer.launch().then(async browser => {
        screenshotter.options.browser = browser;
    });
}

Screenshotter.prototype.serve = async function (path) {
    process.stdout.write(c.yellow(`Waiting for Express to launch`));
    let screenshotter = this;
    const app = express();
    process.stdout.write(c.yellow(`.`));
    let [port] = await fp(5000);
    app.use(express.static(path));
    screenshotter.options.app = app;
    process.stdout.write(c.yellow(`.`));
    screenshotter.options.server = await app.listen(port);
    console.log(c.greenBright("✓"));
    return `http://localhost:${port}/`;
}

Screenshotter.prototype.takeScreenshot = async function (url) {
    let screenshotter = this;
    url = url || screenshotter.options.url;

    process.stdout.write(c.yellow(`Waiting for Puppetter to launch`));
    await screenshotter.puppetCheck();

    console.log(c.cyan(`Opening ${url}`));

    return await this.options.browser.newPage().then(async page => {
        await page.emulateMedia('screen');
        await page.setViewport({
            width: screenshotter.options.screenSize.width,
            height: screenshotter.options.screenSize.height
        });
        console.log(c.cyan(`Waiting for load`));
        await Promise.all([
            page.waitForNavigation(),
            page.goto(url)
        ]);
        console.log(c.cyan(`Screenshotting`));
        let img = await page.screenshot({
            fullPage: screenshotter.options.fullPage,
            encoding: (screenshotter.options.base64?"base64":"binary")
        });

        console.log(c.greenBright(`Screenshot complete`));

        await page.close();

        return img;
    })
}

Screenshotter.prototype.shutdownBrowser = async function () {
    await this.options.browser.close();
}

Screenshotter.prototype.shutdownServer = async function () {
    await this.options.server.close();
}

module.exports = Screenshotter;