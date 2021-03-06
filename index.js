const DhtSpider = require('./lib/dhtSpider/dhtSpider');
const TorrentController = require('./lib/dhtSpider/torrentController');
const indexOperation = require('./lib/indexOperation');
const config = require('./config');

const Koa = require('koa');
const app = new Koa();
const Router = require("koa-router");
const path = require("path");
const Static = require('koa-static');
const BodyParser = require('koa-bodyparser');
let btSearch = require("./lib/server/btSearch");
let getInfo = require("./lib/server/getInfo");
//torrent controllerInit
let torrentController = new TorrentController();
torrentController.dispatch();

let count = 0, status = true;
//dht spider
let spider = new DhtSpider(config.address, config.port, torrentController);
let restart = function () {
    if (!status) {
        status = true;
        spider.startListening();
        torrentController.dispatch();
        setTimeout(() => {
            scanIndex()
        }, 1800000);
    }
};

let scanIndex = function () {
    if (status) {
        status = false;
        spider.stopInterval();
        torrentController.stop();
        setTimeout(() => {
            if (count === 0) {
                count++;
                indexBackup();
            } else if (count === 12) {
                count = 0;
                indexBackup();
            }
            else {
                count++;
                restart();
            }

        }, config.downloadMaxTime + 9000);
    }
};

let indexBackup = function () {
    let backup = indexOperation.indexBackup().once('backupFinish', function () {
        console.log("backupFinish");
        backup.removeListener("backupFinish", (text) => {
            console.log(text);
        });
        //valueFilter();
        restart();
    })
};

setTimeout(() => {
    scanIndex()
}, 0);

setInterval(() => {
    console.log(process.memoryUsage());
}, 60000);


const staticPath = './static';
app.use(Static(
    path.join(__dirname, staticPath)
));

app.use(BodyParser());

// 装载所有子路由
let router = new Router();
router.get('/btSearch', async (ctx) => {
    try {
        let obj = {};
        if (Object.prototype.toString.call(ctx.query) === "[object Object]") {
            obj = ctx.query;
        }
        else {
            obj = JSON.parse(ctx.query);
        }
        await btSearch(obj).then((result) => {
            ctx.body = JSON.stringify(result);
        }).catch((err) => {
            ctx.status = 500;
            ctx.body = err;
        })
    } catch (err) {
        ctx.status = 500;
        ctx.body = 'Oh my 404!';
    }
});

router.get('/getInfo', async (ctx) => {
    try {
        await getInfo().then((result) => {
            ctx.body = JSON.stringify(result);
        }).catch((err) => {
            ctx.status = 500;
            ctx.body = err;
        })
    } catch (err) {
        ctx.status = 500;
        ctx.body = 'Oh my 404!';
    }
});

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods());


app.listen(12345);
console.log('[demo] start-quick is starting at port 12345');
