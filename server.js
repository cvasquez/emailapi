/** Tutorials
Koajs QuickStart Guide: http://knowthen.com/episode-3-koajs-quickstart-guide/
**/

const Koa = require('koa');
const app = new Koa();

app.use(ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
