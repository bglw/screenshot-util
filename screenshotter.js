const puppeteer = require('puppeteer');
const express = require('express');
const fp = require("find-free-port");
const c = require('ansi-colors');
const log = require('fancy-log');
const timeout = ms => new Promise(res => setTimeout(res, ms));

const MAX_PUPPETEER_TIMEOUT = 60000;

function Screenshotter(options) {
    const defaults = {
        fullPage: false,
        url: "https://cloudcannon.com",
        base64: false,
        docker: false,
        delay: 300,
        path: ".",
        portInc: 0
    }
    this.options = Object.assign({}, defaults, options);
}

Screenshotter.prototype.puppetLaunched = function () {
    return !!this.options.browser;
};

Screenshotter.prototype.puppetCheck = async function () {
    while (!this.puppetLaunched()) {
        await timeout(500);
        process.stdout.write(c.yellow(`:`));
    }
    return;
};

Screenshotter.prototype.launch = function () {
    let screenshotter = this;
    let args = [];
    if (screenshotter.options.docker) args.push(...['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'])
    puppeteer.launch({
        args: args
    }).then(async browser => {
        screenshotter.options.browser = browser;
    });
}

Screenshotter.prototype.serve = async function (path, portInc) {
    let screenshotter = this;
    if (!path) path = screenshotter.options.path;
    if (!portInc) portInc = screenshotter.options.portInc;
    if (screenshotter.options.server) {
        const port = screenshotter.options.server.address().port;
        return `http://localhost:${port}`
    }
    process.stdout.write(c.yellow('Launching webserver...'));
    const app = express();
    process.stdout.write(c.yellow('.'));
    let [port] = await fp(5000);
    port += portInc;
    app.use(express.static(path));
    screenshotter.options.app = app;
    process.stdout.write(c.yellow('.\n'));
    screenshotter.options.server = await app.listen(port);
    log(c.greenBright(`Done ✓`));
    return `http://localhost:${port}`;
}

Screenshotter.prototype.loadPage = async function(serverUrl, url, screenSize) {
    let requestUrl = (serverUrl + "/" + url).replace(/\//g, "/");

    log(`Loading ${url} on ${screenSize.name}`);
    log('Launching page');

    const page = await this.options.browser.newPage();

    log('Setting up page');
    await page.emulateMedia('screen');
    await page.setUserAgent('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36');
    await page.setViewport({
        width: screenSize.width,
        height: screenSize.height
    });

    log(`Navigating to ${requestUrl}`);
    function logRequest(interceptedRequest) {
      log('A request was made:', interceptedRequest.url());
    }
    page.on('request', logRequest);
    page.once('load', () => log('Page loaded!'));

    var successful = true;
    await page.goto(requestUrl, {waitUntil: 'networkidle2'}).catch((e) => {
        log.error(e);
        successful = false;
    });

    page.removeListener('request', logRequest);

    if (successful) {
        log(`Navigated to ${page.url()}`);
        await page._client.send('Animation.setPlaybackRate', { playbackRate: 20 });
        return page;
    }

    return page;
}

Screenshotter.prototype.takeScreenshot = async function (page) {
    if (this.options.delay) await timeout(this.options.delay);
    log(`Taking screenshot of ${page.url()}`);
    let screenshotOptions = {
        encoding: (this.options.base64 ? "base64" : "binary")
    };
    const bodyHandle = await page.$('body');
    const { width, height } = await bodyHandle.boundingBox();
    if (this.options.fullPage) {
        screenshotOptions.clip = {
            x: 0,
            y: 0,
            width,
            height
        };
    }
    const screenshot = await page.screenshot(screenshotOptions);
    await bodyHandle.dispose();

    log(c.greenBright(`Screenshot completed ${page.url()} ✓`));

    await page.close();
    return screenshot;
}

Screenshotter.prototype.shutdownBrowser = async function () {
    await this.options.browser.close();
}

Screenshotter.prototype.shutdownServer = async function () {
    await this.options.server.close();
}

module.exports = Screenshotter;
