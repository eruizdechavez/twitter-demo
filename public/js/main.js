$(() => {
	// Socket connection to NodeJS
	var socket = io.connect('http://' + window.location.hostname + ':' + window.location.port);

	// Do something when we receive tweet(s)
	socket.on('tweets', data => {
		// Get the template from the HTML
		var template = '<div class="row" id="">' + $('.row:first').html() + '</div>';
		$.each(data, (key, tweet) => {
			// If the item is already on the DOM, do not add it again
			if($('#' + tweet.id).length) {
				return;
			}

			// Create a new HTML node using the template using this tweet data
			var tweet_view = $(template);
			tweet_view.attr('id', tweet.id);
			$('.span1 img', tweet_view).attr('src', tweet.user.profile_image_url);
			$('.span2', tweet_view).text(tweet.user.screen_name);
			$('.span9', tweet_view).text(tweet.text);

			// Add the tweet to the DOM
			// TODO: make sure tweets are added on the right order
			$('#container').prepend(tweet_view);
		});
	});
});