const Koa = require('koa');
const axios = require('axios');
const twitter = require('twitter');
const cheerio = require('cheerio');
const OAuth2 = require('OAuth').OAuth2;
const credentials = require('./credentials');
const app = new Koa();

app.use(async (ctx) => {
  // Example URLs
  var rss1 = 'http://powertimepodcast.com/feed/podcast';
  var rss2 = 'http://talkingrobocop.libsyn.com/rss';
  var rss3 = 'http://feeds.podtrac.com/zKq6WZZLTlbM';
  var blogfeed = 'https://blog.aweber.com/feed';
  var url1 = 'https://www.aweber.com';
  var url2 = 'https://www.google.com';
  var url3 = 'https://www.embed.ly/cards';

  // Create array for storing url information
  let meta = {};
  const site = ctx.request.query.awq;

  try {
    const response = await axios.get(site);

    // Used for understanding if a page is rss or html.
    var contentType = response.headers['content-type'];

    // Attempt to get information about a url that points to an rss feed
    if(contentType.includes("application/rss+xml") || contentType.includes("text/xml") || contentType.includes("application/xml")) {

      // Use cheerio to ready axios response for easy interpretation assuming it is xml.
      var $ = cheerio.load(response.data,  {
        normalizeWhitespace: true,
        xmlMode: true,
        decodeEntities: true
      });

      // Add generic rss feed JSON information to array
      meta = {
        category: 'rss',
        type: 'generic',
        // @TODO add favicon
        title: $('rss title').first().text(),
        description: $('rss description').first().text(),
        link: $('rss link').first().text(),
        items: []
      };

      // Check to see if the feed is for a podcast. If so, set type to podcast and add podcast specific information to JSON
      if($('rss itunes\\:author').text()){
        meta = Object.assign(meta,{
          type: 'podcast',
          author: $('rss itunes\\:author').first().text(),
          summary: $('rss itunes\\:summary').first().text(),
          image: $('rss itunes\\:image').attr('href')
        });
      }

      // Loop through RSS Items
      $('item').each( (i, elem)=> {
        meta.items.push({
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
      meta = {
        category: 'html',
        type: 'generic',
        // @TODO add favicon
        title: ($('meta[property="og:title"]').attr('content') || $('title').first().text()),
        description: ($('meta[property="og:description"]').attr('content') || $('description').first().text()),
        image: $('meta[property="og:image"]').attr('content'),
        link: $('meta[property="og:url"]').attr('content')
      };

      // Check to see if the page is for a YouTube video. If so, set type to youtube and add youtube specific information to JSON
      if(site.includes('youtube.com/watch' || 'youtu.be/')) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = ctx.request.url.match(regExp);
        var ytId = (match&&match[7].length==11)? match[7] : false;

        try {
          const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
              key: credentials.youtube.key,
              part: 'statistics',
              id: ytId
            }
          });

          meta = Object.assign(meta,{
            type: 'YouTube',
            // Need an additional scope (either snippet or contentDetails) if I want non-stat meta like: channelTitle: ytResponse.data.items[0].snippet.channelTitle,
            viewCount: ytResponse.data.items[0].statistics.viewCount,
            likeCount: ytResponse.data.items[0].statistics.likeCount,
            dislikeCount: ytResponse.data.items[0].statistics.dislikeCount,
            commentCount: ytResponse.data.items[0].statistics.commentCount
          });

        } catch(e) {
          console.log('Error: ', e);
        }
      }
      // Check to see if the page is for a Twitter user. If so, set type to Twitter and add youtube specific information to JSON
      else if(site.includes('twitter.com/')) {
        // Make OAuth2 request for an application only bearer token for Twitter
        var oauth2 = new OAuth2(credentials.twitter.consumer_key, credentials.twitter.consumer_secret, 'https://api.twitter.com/', null, 'oauth2/token', null);
        oauth2.getOAuthAccessToken('', {
            'grant_type': 'client_credentials'
          }, function (e, access_token) {
            var twtr = new twitter({
              consumer_key: credentials.twitter.consumer_key,
              consumer_secret: credentials.twitter.consumer_secret,
              bearer_token: access_token
            });

            var twtrParams = {
              screen_name: 'clickpop',
              count: '1'
            };

            twtr.get('https://api.twitter.com/1.1/statuses/user_timeline.json', twtrParams, function(error, tweets, response){
              console.log(tweets);
            });
        });
      }

    }

    ctx.headers['content-type'] = 'application/json';
    ctx.body = meta;

  } catch(e) {
    ctx.body = "Error: " + e;
  }
});

app.listen(8080);
