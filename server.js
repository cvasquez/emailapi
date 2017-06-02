const Koa = require('koa');
const axios = require('axios');
const cheerio = require('cheerio');
const app = new Koa();

// Create array for storing url information
const meta = [];
var rss1 = 'http://powertimepodcast.com/feed/podcast';
var rss2 = 'http://talkingrobocop.libsyn.com/rss';
var rss3 = 'http://feeds.podtrac.com/zKq6WZZLTlbM';
var blogfeed = 'https://blog.aweber.com/feed';
var url1 = 'https://www.aweber.com';
var url2 = 'https://www.google.com';

app.use(async (ctx, next) => {
  await next();
  ctx.body = meta;
});

axios.get(rss2)
  .then( (response) => {
    // Empty meta array
    meta.length = 0;

    // Use cheerio to ready axios response for easy interpretation
    var $ = cheerio.load(response.data);

    // Attempt to get information about a url that points to an rss feed
    if($('rss').text()) {
      meta.push( {
        category: 'rss',
        title: $('rss title').first().text()
      });
      if($('rss itunes\\:author').text()){
        meta.push({
          type: 'podcast',
          author: $('rss itunes\\:author').first().text(),
          summary: $('rss itunes\\:summary').first().text(),
          description: $('rss description').first().text(),
          image: $('rss itunes\\:image').attr('href')
        });
      } else {
        meta.push({
          type: 'generic'
        });
      }
      $('item').each( (i, elem)=> {
        meta.push({
          item: {
            title: $(elem).find('title').text(),
            pubDate: $(elem).find('pubDate').text(),
            link: $(elem).find('link').text()
          }
        });
      })
    } else if($('html').text()) {
      meta.push( {
        type: 'html',
        title: $('title').first().text()
      });
    }
    return(meta);
  })
  .then( (meta) => {
    console.log(meta);
  })
  .catch( (error) => {
    console.log(error);
  });

app.listen(4001);
