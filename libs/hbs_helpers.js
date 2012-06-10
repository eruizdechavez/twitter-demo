var hbs = require('hbs');

hbs.registerPartial('tweet', '<div class="row" id="{{id}}"><div class="span1"><img src="{{user.profile_image_url}}"></div><div class="span2">{{user.screen_name}}</div><div class="span9">{{text}}</div></div>');
