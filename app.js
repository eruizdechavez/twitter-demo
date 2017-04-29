// # Twitter Demo Application
//
// Uses several ideas from several places:
// - OAuth: Login to Twitter.
// - Socket.io: Monitor and notify clients about new tweets.
// - Handlebars: Template engine. I do not like Jade.
// ## Module dependencias
var express = require('express');

var connect = require('express/node_modules/connect');
var MemoryStore = connect.middleware.session.MemoryStore;
var parseCookie = connect.utils.parseCookie;
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var _ = require('underscore');

// ## Application controllers
var oa_controller = require('./controllers/oauth_controller');

var twitter_controller = require('./controllers/twitter_controller');

// ## View helpers
var hbs_helpers = require('./libs/hbs_helpers');

// ## Misc variables
var store;

// ## Application configuration
app.configure(() => {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'hbs');
	app.set('oauth callback', '/callback');
	app.set('oauth consumer key', '');
	app.set('oauth consumer secret', '');
	app.use(express.cookieParser());
	app.use(express.session({
		key: 'twitter-demo.sid',
		secret: 'uber cool and ultra awesome secret session keyword',
		store: store = new MemoryStore()
	}));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('local', 'development', () => {
	app.set('app domain', 'http://localhost');
	app.set('app port', 3000);
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

app.configure('production', () => {
	app.set('app domain', 'http://yoursite.com');
	app.set('app port', 3001);
	app.use(express.errorHandler());
});

// ## OAuth initialization
//
// Parameters:
// - Consumer Key
// - Consumer Secret
// - Callback URL
oa_controller.initialize(app.set('oauth consumer key'), app.set('oauth consumer secret'), app.set('app domain') + ':' + app.set('app port') + app.set('oauth callback'));

// ## Routes
// ### Main (and only) route
app.get('/', oa_controller.auth, twitter_controller.home_timeline, (req, res, next) => {
	req.session.since_id = _.max(req.twitter.home_timeline, tweet => tweet.id).id + 1;

	res.render('index', {
		title: 'Hello World!',
		home_timeline: req.twitter.home_timeline
	});
});

// ### Callback route
// Will only be used after OAuth login.
app.get('/callback', oa_controller.callback('/'));

// ### Start Express
app.listen(app.set('app port'), () => {
	console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
});

// ## Socket.IO
// ### Autorization callback
//
// Thanks to Daniel Baulig for this awesome example on how to share
// session data between Express and Socket.io
// http://www.danielbaulig.de/socket-ioexpress/
//
// Retrieve user cookie from express and save it to the socket
io.set('log level', 0).set('authorization', (data, accept) => {
	if (!data.headers.cookie) {
		return accept('No cookie transmitted.', false);
	}

	data.cookie = parseCookie(data.headers.cookie);
	data.sessionID = data.cookie['twitter-demo.sid'];

	store.load(data.sessionID, (err, session) => {
		if (err || !session) {
			return accept('Error', false);
		}

		data.session = session;
		return accept(null, true);
	});
});

// ### Socket listeners
io.sockets.on('connection', socket => {
	var session = socket.handshake.session;

	var interval = setInterval(() => {
		// Send our controller the required data to connect to Twitter
		twitter_controller.since({
			consumer_key: app.set('oauth consumer key'),
			consumer_secret: app.set('oauth consumer secret'),
			access_token: session.oauth.access_token,
			access_token_secret: session.oauth.access_token_secret,
			since_id: session.since_id
		}, (err, res) => {
			// TODO: Handle the error
			if (err) {
				console.log(err);
			} else {
				// Save last id
				var since_id = _.max(res, tweet => tweet.id);
				if (since_id) {
					session.since_id = since_id.id + 1;
					session.touch().save();
				}

				// Send found tweets to the client
				socket.emit('tweets', res);
			}
		});
	}, 15 * 1000);

	socket.on('disconnect', () => {
		if (interval) {
			clearInterval(interval);
		}
	});
});
