const express = require('express');
const app = express();
const http = require('http').Server(app);
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
  redisClient.lrange('tweets', 0, 100, (err, tweets) => {
    if(err) return console.log(err);
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

setInterval(() => {redisClient.ltrim('tweets', 1000);}, 100000);
app.use(express.static(__dirname + '/app'));
app.use((req, res) => {
  res.status(404).send(__dirname + '/app/four_oh_four.html');
});

http.listen(port, () => console.log('server up on port ' + port));
