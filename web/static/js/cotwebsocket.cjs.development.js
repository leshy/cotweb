'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var lshFoundation = require('lsh-foundation');
var path = require('path');
var express = require('express');
var http = require('http');
var engine = require('engine.io');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return n;
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

//@ts-ignore
//@ts-ignore
const createError = /*#__PURE__*/require('http-errors');
const root = /*#__PURE__*/path__namespace.join(__dirname, '../');
const init = async () => {
  const {
    logger,
    config
  } = await lshFoundation.appCore.init({
    name: 'cot-websocket',
    configDir: path__namespace.join(root, 'config'),
    verbose: true,
    defaultConfig: {}
  });
  const app = express();
  const httpServer = http.createServer(app);
  app.set('views', path__namespace.join(config.rootDir, 'web/views'));
  app.set('view engine', 'ejs');
  app.use(express.json());
  app.use(express.urlencoded({
    extended: false
  }));
  app.use(express.static(path__namespace.join(config.rootDir, 'web/static')));
  app.get('/', function (req, res, next) {
    res.render('index', {
      title: 'Express'
    });
  });
  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });
  //@ts-ignore
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.log(config);
    //@ts-ignore
    res.locals.error = config.env === lshFoundation.configSystem.Env.dev ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
  const sockets = engine.attach(httpServer, {});
  // @ts-ignore
  sockets.on('connection', socket => {
    console.log('connected');
    socket.send('hello');
    // @ts-ignore
    socket.on('message', data => {
      console.log(data);
      // @ts-ignore
      socket.on('close', () => {});
    });
  });
  httpServer.listen(3001);
};
init();

exports.init = init;
//# sourceMappingURL=cotwebsocket.cjs.development.js.map
