var socket = window.io();
var tweetList = document.getElementById('tweetlist');

var prependTweet = (tweet) => {
    var tweetEl = document.createElement('li');
    tweetEl.innerHTML = '<img src="' + tweet.user.profile_image_url + '" alt="profile image"><p>' + tweet.text + '</p>'; 
    tweetList.insertBefore(tweetEl, tweetList.firstChild);
};

socket.on('tweets', function(tweets) {
  tweets.forEach(function(tweet) {
    prependTweet(tweet);
  });
});

socket.on('tweet', function(tweet) {
  prependTweet(tweet);
});
