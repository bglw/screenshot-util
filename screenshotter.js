const puppeteer = require('puppeteer');
const express = require('express');
const fp = require("find-free-port");
const c = require('ansi-colors');
const log = require('fancy-log');
const {TimeoutError} = require('puppeteer/Errors');
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

    await page.setRequestInterception(true);
    function interceptRequests(interceptedRequest) {
      const url = interceptedRequest.url();
      const filters = [
        'cdn.walkme.com',
        'www.googletagmanager.com',
        'www.google-analytics.com',
        'www.youtube.com'
      ];
      const shouldAbort = filters.some((urlPart) => url.includes(urlPart));
      if (shouldAbort) {
        log(c.yellow('Request blocked: ') + url);
        interceptedRequest.abort();
      } else {
        log(c.blue('Request started: ') + url);
        interceptedRequest.continue();
      }
    }

    page.on('request', interceptRequests);

    log(`Navigating to ${requestUrl}`);
    try {
      await page.goto(requestUrl, {waitUntil: 'load'});
      log(`Navigated to ${page.url()}`);
      await page._client.send('Animation.setPlaybackRate', { playbackRate: 20 });
      log(`Animation playback rate set to 20x on ${page.url()}`);
    } catch (e) {
      if (e instanceof TimeoutError) {
        log(`Navigation timed out on ${page.url()}, trying to continue`);
      } else {
        log(`Navigation failed on ${page.url()}, trying to continue`);
        log.error(e);
      }
    }

    page.removeListener('request', interceptRequests);
    return page;
}

Screenshotter.prototype.takeScreenshot = async function (page) {
    if (this.options.delay) {
      log(`Waiting ${this.options.delay}ms`);
      await timeout(this.options.delay);
    }

    let screenshotOptions = {encoding: (this.options.base64 ? "base64" : "binary")};

    log(`Finding page size`);
    const { width, height } = await page.evaluate(() => {
        const body = document.querySelector('body');
        const boundingBox = body.getBoundingClientRect();
        return {width: boundingBox.width, height: boundingBox.height};
    }).catch(e => log.error(e));

    if (this.options.fullPage) {
        screenshotOptions.clip = {
            x: 0,
            y: 0,
            width,
            height
        };
    }

    log(`Taking screenshot at ${width}px by ${height}px`);
    const screenshot = await page.screenshot(screenshotOptions);

    log(c.greenBright(`Screenshot completed ${page.url()} ✓`));

    await page.close();
    log(`Page closed`);

    return screenshot;
}

Screenshotter.prototype.shutdownBrowser = async function () {
    await this.options.browser.close();
}

Screenshotter.prototype.shutdownServer = async function () {
    await this.options.server.close();
}

module.exports = Screenshotter;
