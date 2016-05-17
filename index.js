'use strict';

var merge = require('merge');
var moment = require('moment');

var debug = console.log;
//var debug = function(){};

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

var blog_options = {};

var blog = function(options) {
	blog_options = merge.recursive({}, def, options);

	var ret = function(files, metalsmith, done) {
		debug('[metalsmith: blog()] init');
		var valid = [];

		debug('[metalsmith: blog()] valid collections');
		debug(blog_options.collections);

		Object.keys(files).forEach(function(file) {
			if (!files[file].collection)
				return;

			// Check if it's a valid file for us to put on recent posts
			if (files[file].collection && files[file].collection.indexOf(blog_options.recent.collection) >= 0)
				valid.push(files[file]);

			debug('[metalsmith: blog()] %s has the following collections: %s', file, JSON.stringify(files[file].collection));
			// Check if we belong to any collection and set the proper layout
			Object.keys(blog_options.collections).forEach(function(collection) {
				if (files[file].collection.indexOf(collection) >= 0) {
					files[file].layout = blog_options.collections[collection];
					console.log('[metalsmith: blog()] %s is using layout %s', file, blog_options.collections[collection]);
				}
			});
		});

		// Recent posts
		valid.sort(function(a, b) {
			var ma = moment(a.date);
			var mb = moment(b.date);
			return(ma.isBefore(mb))
		})
		metalsmith.metadata().allPosts = valid;
		metalsmith.metadata().recents = valid.slice(0, blog_options.recent.count);


		// Front page
		files['index.html'] = {
			path: 'index.html',
			title: '',
			contents: '',
			layout: blog_options.layout,
			posts: valid.slice(0, blog_options.posts_per_page)
		};

		// Other pages
		var curPage = 1;
		valid = valid.slice(blog_options.posts_per_page, blog_options.posts_per_page + blog_options.posts_per_page);
		while(valid.length > 0) {
			var p = curPage + '/index.html';
			files[p] = {
				path: p,
				title: 'Page ' + curPage,
				contents: '',
				layout: blog_options.layout,
				slug: curPage,
				collection: [ 'pagination' ],
				posts: valid.slice(0, blog_options.posts_per_page)
			};

			valid = valid.slice(blog_options.posts_per_page, blog_options.posts_per_page + blog_options.posts_per_page);
			curPage++;
		}

		debug('[metalsmith: blog()] done');
		done();
	};

	return(ret);
};

/**
 * Save categories found on each file metadata and consolidates the information on 'site_categories'.
 * The result is a dictionation in the format '{ category1: { count: count1, posts: [] }, category2: { count: count2, posts: [] }, ...}'
 */
blog.categories = function(options) {
	var categories;

	var addCategory = function(cat, file) {
		if (!categories.hasOwnProperty(cat)) {
			categories[cat] = {
				count: 1,
				posts: [ file ]
			};
		}
		else {
			categories[cat].count = categories[cat].count + 1;
			categories[cat].posts.push(file);
		}
	};

	var ret = function(files, metalsmith, done) {
		categories = {};
		var metadata = metalsmith.metadata();

		Object.keys(files).forEach(function(file) {
			var data = files[file];

			if (data.categories) {
				var cat = null;
				if (typeof(data.categories) === 'string')
					cat = data.categories;
				else if (Array.isArray(data.categories)) {
					if (typeof(data.categories[0]) === 'string')
						cat = data.categories[0];
				}

				if (cat)
					addCategory(cat, data);
			}
		});

		if (!metadata.site)
			metadata.site = {};

		// Add metadata
		metadata.site.categories = categories;
		// Add category pages
		Object.keys(categories).forEach(function(cat) {
			var path = 'categories/' + cat.toLowerCase().replace(' ', '-') + '.html';

			files[path] = {};
			files[path].path = path;
			files[path].title = cat;
			files[path].contents = '';
			files[path].posts = categories[cat].posts;
			files[path].layout = blog_options.categories.layout;
		});

		metalsmith.metadata(metadata);

		done();
	};

	return(ret);
};


/**
 * Save tags found on each file metadata and consolidates the information on 'site_tags'.
 * The result is a dictionation in the format
 * '{ tag1: { count: tag1, posts: [] }, tag2: { count: tag2, posts: [] }, ...}'
 */
blog.tags = function() {
	var tags;

	var addTag = function(tag, file) {
		if (!tags.hasOwnProperty(tag)) {
			tags[tag] = {
				count: 1,
				posts: [ file ]
			};
		}
		else {
			tags[tag].count = tags[tag].count + 1;
			tags[tag].posts.push(file);
		}
	};

	var ret = function(files, metalsmith, done) {
		tags = {};
		var metadata = metalsmith.metadata();

		Object.keys(files).forEach(function(file) {
			var data = files[file];

			if (data.tags) {
				var cat = null;
				if (typeof(data.tags) === 'string') {
					addTag(data.tags)
				}
				else if (Array.isArray(data.tags)) {
					data.tags.forEach(function(t) {
						if (typeof(t) === 'string')
							addTag(t);
					});
				}
			}
		});

		if (!metadata.site)
			metadata.site = {};
		
		// Add metadata
		metadata.site.tags = tags;
		// Add tag pages
		Object.keys(tags).forEach(function(tag) {
			var path = 'tags/' + tag.toLowerCase().replace(' ', '-') + '.html';

			files[path] = {};
			files[path].path = path;
			files[path].title = tag;
			files[path].contents = '';
			files[path].posts = tags[tag].posts;
			files[path].layout = blog_options.tags.layout;
		});

		metalsmith.metadata(metadata);

		done();
	};

	return(ret);
}

module.exports = blog;
