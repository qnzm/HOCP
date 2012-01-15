var express = require('express');
var app = express.createServer();
var oauth = new (require('oauth').OAuth)(
	'https://www.hatena.com/oauth/initiate',
	'https://www.hatena.com/oauth/token',
	'! consumer key',
	'! consumer secret',
	'1.0',
	'! callback url',
	'HMAC-SHA1'
);

app.configure(function() {
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "secret" }));
	app.set('view engine', 'jade')
});

app.dynamicHelpers({
	session: function(req, res) {
		return req.session;
	}
});

app.get('/', function(req, res) {
	res.render('index', { layout: false });
});

app.get('/auth/hatena', function(req, res) {
	oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
		if(error) {
			res.send(error)
		} else {
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			req.session.oauth.token_secret = oauth_token_secret;
			res.redirect('https://www.hatena.ne.jp/oauth/authorize?oauth_token=' + oauth_token);
		}
	});
});

app.get('/auth/hatena/callback', function(req, res) {
	if(req.session.oauth) {
		req.session.oauth.verifier = req.query.oauth_verifier;

		oauth.getOAuthAccessToken(req.session.oauth.token, req.session.oauth.token_secret, req.session.oauth.verifier,
					  function(error, oauth_access_token, oauth_access_token_secret, results) {
						  if(error) {
							  res.send(error);
						  } else {
							  req.session.oauth.access_token = oauth_access_token;
							  req.session.oauth.access_token_secret = oauth_access_token_secret;
							  req.session.user_profile = results
							  res.redirect('/');
						  }
					  }
					 );
	}
});

app.get('/signout', function(req, res) {
	delete req.session.oauth;
	delete req.session.user_profile;
	res.redirect('/');
});

app.listen(3000);

