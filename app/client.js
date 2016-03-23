var socket = window.io();
var tweetList = document.getElementById('tweetlist');
var prependTweet = (tweet) => {
    var tweetEl = document.createElement('li');
    tweetEl.innerHTML = '<img src="' + tweet.user.profile_image_url + '" alt="profile image">' + tweet.text; 
    tweetList.insertBefore(tweetEl, tweetList.firstChild);
};

socket.on('tweets', (tweets) => {
  tweets.forEach((tweet) => {
    prependTweet(tweet);
  });
});

socket.on('tweet', (tweet) => {
  prependTweet(tweet);
});
