"use strict";

module.exports = {
	root: null,

	rbac: {
		options: {},
		role: {
			guest: "guest"
		}
	},

	log: true,

	morgan: {
		format: process.env.NODE_ENV === "development" ? "dev" : "combined",
		options: {
			immediate: false
			//stream: process.stdout
		}
	},

	server: {
		build: 1,
		host: process.env.HOST || "127.0.0.1",
		port: process.env.PORT || 4000
	},

	request: {
		timeout: 1000 * 60 * 5
	},

	compression: {},

	powered: {
		value: "Maglev"
	},

	responseTime: {},

	methodOverride: {
		//https://github.com/expressjs/method-override
		enabled: true,
		getter: "X-HTTP-Method-Override",
		options: {}
	},

	bodyParser: [{
		parse: "urlencoded",
		options: {
			extended: true
		}
	}, {
		parse: "json",
		options: {}
	}, {
		parse: "json",
		options: {
			type: "application/vnd.api+json"
		}
	}],

	cookieParser: {
		secret: null,
		options: {}
	},

	token: {
		secret: null,
		expiration: 60 * 24 * 14
	},

	session: {
		secret: null,
		cookie: {
			maxAge: 14 * 24 * 60 * 60 * 1000 //2 weeks
		},
		resave: true,
		saveUninitialized: true
	},

	view: {
		engine: "swig"
	},

	router: {
		api: {
			path: "/api"
		}
	},

	locale: {
		"default": "en",
		available: ["en"],
		inUrl: false
	},

	country: {
		"default": null,
		available: [],
		inUrl: false
	},

	registration: {
		simple: true
	},

	facebook: {
		clientID: null,
		clientSecret: null,
		namespace: null
	},

	upload: {
		maxFieldsSize: 2000000,
		maxFields: 1000,
		path: null
	},

	cors: {},

	page: {
		error: null,
		notFound: null
	},

	strategies: [],

	css: {
		path: "/public/css",
		root: "public/css",
		options: {}
	},

	"static": {
		path: "/public",
		root: "public",
		options: {
			index: true
		}
	},

	favicon: {
		root: "public/favicon.ico",
		options: {}
	}
};