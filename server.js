const http = require('http');
const fs = require('fs');
const redis = require('redis');
const Twitter = require('twitter');
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

const redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost');

var normalizeTweet = (tweet) => {
  return {text: tweet.text, user: tweet.user, source: tweet.source};
};

twitterClient.get('search/tweets', {q: 'manintree'}, (err, tweets) => {
  if (err) return console.log(err);
  tweets.statuses.forEach((tweet) => {
    redisClient.lpush('tweets', JSON.stringify(normalizeTweet(tweet)));
  });
});

io.on('connection', (connection) => {
  redis.lrange(0, 100, (tweets) => {
    var parsedTweets = tweets.map((tweet) => {
      return JSON.parse(tweet);
    });

    connection.emit('tweets', parsedTweets);
  });
});

twitterClient.stream('statuses/filter', {track: 'manintree'}, (stream) => {
  stream.on('data', (tweet) => {
    redisClient.lpush('tweets', JSON.stringify(normalizeTweet(tweet)));
    io.emit('tweet', normalizeTweet(tweet));
  });

  stream.on('error', (err) => {
    console.log(err);
  });
});

var fourOhFour = function(res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  fs.createReadStream(__dirname + '/app/four_oh_four.html').pipe(res);
};

http.createServer((req, res) => {
  if (req.method !== 'GET')
    return fourOhFour(res);

  var filePath = __dirname + '/app' + (req.url === '/' ? '/index.html' : req.url);
  fs.stat(filePath, (err, stats) => {
    if (err || !(stats.isFile()))
      return fourOhFour(res);

    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, () => console.log('server up on port ' + port));
