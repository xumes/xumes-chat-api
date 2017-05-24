var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');

var app = express();
var server = require('http').Server(app)
var io = require('socket.io')(server)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.set('mongo-host', '127.0.0.1')
app.set('mongo-port', 27017)
app.set('mongo_db', 'xumeschat_dev')
app.set('mongo_url', `mongodb://${app.get('mongo-host')}:$app.get('mongo-port')/${app.get('mongo_db')}`)
mongoose.connect(app.get('mongo_url'))

app.use((req, res, next) => {
  res.io = io
  next()
})

var sockets = io.sockets
sockets.on('connection', function(socket) {
  console.log('A new connection has been established')

  socket.on('message room', function(data) {
    socket.broadcast.in(data.room).emit('messaged', {
      message: data.message,
      room: data.room
    })
  })

  socket.on('message user', function(data) {
    socket.broadcast.in(data.user).emit('messaged', {
      message: data.message,
      user: data.user
    })
  })

  socket.on('join user', function(data) {
    socket.user = data.user
    socket.join(socket.user)
    console.log("user data",  data)
    socket.emit('joined user', data)
  })

  socket.on('join room', function(data) {
    socket.room = data.room
    socket.join(socket.room)

    socket.emit('joined room', data)
  })

  socket.on('leave room', function(data) {
    socket.leave(data.room)
    socket.room = ''

    socket.emit('leaved room', true)
  })
})

require('./routes.js')(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {
  app: app,
  server: server
};
