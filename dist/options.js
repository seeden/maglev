'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  root: null,

  rbac: {
    options: {},
    role: {
      guest: 'guest'
    }
  },

  log: true,

  morgan: {
    format: process.env.NODE_ENV === 'development' ? 'dev' : 'tiny',
    options: {
      // stream: process.stdout
    }
  },

  server: {
    build: 1,
    host: process.env.HOST || '127.0.0.1',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000
  },

  request: {
    timeout: 1000 * 60 * 5
  },

  compression: {},

  powered: {
    value: 'Maglev'
  },

  responseTime: {},

  methodOverride: {
    // https://github.com/expressjs/method-override
    enabled: true,
    getter: 'X-HTTP-Method-Override',
    options: {}
  },

  bodyParser: [{
    parse: 'urlencoded',
    options: {
      extended: true
    }
  }, {
    parse: 'json',
    options: {}
  }, {
    parse: 'json',
    options: {
      type: 'application/vnd.api+json'
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
      maxAge: 14 * 24 * 60 * 60 * 1000 // 2 weeks
    },
    resave: true,
    saveUninitialized: true
  },

  sessionRecovery: {
    tries: 3
  },

  view: {
    engine: 'swig'
  },

  router: {
    api: {
      path: '/api'
    }
  },

  locale: {
    'default': 'en',
    available: ['en'],
    inUrl: false
  },

  country: {
    'default': null,
    available: [],
    inUrl: false
  },

  registration: {
    simple: true
  },

  facebook: {
    appID: null,
    appSecret: null,
    namespace: null
  },

  upload: {
    maxFieldsSize: 1024 * 1024 * 20,
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
    path: '/public/css',
    root: 'public/css',
    options: {
      render: {
        ieCompat: false
      }
    }
  },

  'static': {
    path: '/public',
    root: 'public',
    options: {
      index: ['index.html']
    }
  },

  favicon: {
    root: 'public/favicon.ico',
    options: {}
  },

  memoryLeaks: {
    watch: true,
    showHeap: true,
    path: null
  },

  socket: {
    idleTimeout: 10 * 1000
  },

  shutdown: {
    timeout: 30 * 1000
  },

  sourceMap: {
    root: 'public/dist'
  }
};
module.exports = exports['default'];