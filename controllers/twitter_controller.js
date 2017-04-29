var request = require('request');

// Middleware to retrieve the user home timeline
exports.home_timeline = (req, res, next) => {
    req.twitter = req.twitter || {};

    var oauth = {
		consumer_key: req.app.set('oauth consumer key'),
		consumer_secret: req.app.set('oauth consumer secret'),
		token: req.session.oauth.access_token,
		token_secret: req.session.oauth.access_token_secret
	};

    var url = 'http://api.twitter.com/1/statuses/home_timeline.json';

    request.get({
		url,
		oauth,
		json: true
	}, (e, r, result) => {
		req.twitter.home_timeline = result;
		next();
	});
}

// Public method to retrieve last tweet(s) since since_id
exports.since = (options, callback) => {
    var oauth = {
			consumer_key: options.consumer_key,
			consumer_secret: options.consumer_secret,
			token: options.access_token,
			token_secret: options.access_token_secret
		};

    var url = 'http://api.twitter.com/1/statuses/home_timeline.json?since_id=' + options.since_id;

    request.get({
		url,
		oauth,
		json: true
	}, (err, res, result) => {
		if (err) {
			console.log(err);
			callback(err, null);
		} else {
			callback(null, result);
		}
	});
}
