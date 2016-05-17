metalsmith-blog
=============

Include basic blog functionality on your metalsmith, including: Frontpage, Categories page, Tags page.

Javascript Usage
--------------

Pass options to the assets plugin and pass it to Metalsmith with the use method:

```javascript
var assets = require('metalsmith-blog');

metalsmith.use(blog(options));
metalsmith.use(blog.categories());
metalsmith.use(blog.tags());
```

Default options
--------------

```javascript
var def = {
	// Set layout to frontpage
	layout: 'frontpage.jade',
	recent: {
		collection: 'post',
		count: 10
	},

	posts_per_page: 10,

	// Set layout to each of the collection types
	collections: {
		'post': 'post.jade',
		'page': 'page.jade'
	},

	// Layout of the categories, when using blog.categories()
	categories: {
		layout: 'category.jade'
	},

	// Layout of the tags, when using blog.tags()
	tags: {
		layout: 'tag.jade'
	}
};
```


License
------

MIT