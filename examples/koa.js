const Koa = require('koa');
const c2k = require('koa-connect');
const easyWaf = require('easy-waf');

const app = new Koa();

app.use(c2k(easyWaf({
    queryUrlWhitelist: ['github.com']
})));

app.listen(3000);
