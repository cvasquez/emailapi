/** Tutorials
Koajs QuickStart Guide: http://knowthen.com/episode-3-koajs-quickstart-guide/
**/

const Koa = require('koa');
const request = require('request');
const cheerio = require('cheerio');
const app = new Koa();

app.use(async function (ctx, next) {
  var url = 'http://powertimepodcast.com/feed/podcast';
  request(url, function(error, response, body){
    var $ = cheerio.load(body);
    // console.log($("title").text());
    if($('rss').text()){
      crawlRSS(ctx, $);
    } else {
      crawlHTML(ctx, $);
    }
  });
});

// Attempt to get information about a url that points to an rss feed
function crawlRSS(ctx, cheerio){
  var $ = cheerio;
  title = $('channel > title').text();
}

// Attempt to get informatino about a url that points to a non rss feed
function crawlHTML(cheerio){
  var $ = cheerio;
  var title = $('title').text();
}

app.listen(4001);
