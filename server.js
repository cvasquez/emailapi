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
var url3 = 'https://www.embed.ly/cards';

app.use(async (ctx) => {
  const site = ctx.request.query.awq;

  try {
    const response = await axios.get(site);

    // Empty meta array
    meta.length = 0;

    // Used for understanding if a page is rss or html.
    var contentType = response.headers['content-type'];

    // Attempt to get information about a url that points to an rss feed
    if(contentType.includes("application/rss+xml")) {

      // Use cheerio to ready axios response for easy interpretation assuming it is xml.
      var $ = cheerio.load(response.data,  {
        normalizeWhitespace: true,
        xmlMode: true,
        decodeEntities: true
      });

      // Add generic rss feed JSON information to array
      meta.push( {
        category: 'rss',
        title: $('rss title').first().text(),
        description: $('rss description').first().text(),
        link: $('rss link').first().text()
      });

      // Check to see if the feed is for a podcast. If so, set type to podcast and add podcast specific information to JSON
      if($('rss itunes\\:author').text()){
        meta.push({
          type: 'podcast',
          author: $('rss itunes\\:author').first().text(),
          summary: $('rss itunes\\:summary').first().text(),
          image: $('rss itunes\\:image').attr('href')
        });
      }

      // If the feed is not a podcast, set its type to generic.
      else {
        meta.push({
          type: 'generic'
        });
      }

      // Loop through RSS Items
      $('item').each( (i, elem)=> {
        meta.push({
          item: {
            title: $(elem).find('title').text(),
            pubDate: $(elem).find('pubDate').text(),
            link: $(elem).find('link').text(),
            duration: $(elem).find('itunes\\:duration').text(),
            image: $(elem).find('itunes\\:image').text()
          }
        });

        return i<3;
      });

    }

    // Attempt to get information about a url that points to an html page
    else if(contentType.includes("text/html")) {

      // Use cheerio to ready axios response for easy interpretation assuming it is html.
      var $ = cheerio.load(response.data,  {
        normalizeWhitespace: true
      });

      // Add generic html page JSON information to array
      meta.push( {
        category: 'html',
        title: ($('meta[property="og:title"]').attr('content') || $('title').first().text())
      });

    }

    ctx.body = meta;

  } catch(e) {
    console.log('Error: ', e);
  }
});

app.listen(4001);
