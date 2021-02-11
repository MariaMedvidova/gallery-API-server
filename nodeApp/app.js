const express = require('express');
const bodyParser = require('body-parser')
const morgan = require('morgan')

var galleryRouter = require('./routes/gallery');
var imagesRouter = require('./routes/images');
var authRouter = require('./routes/auth');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Handling CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE')
    return res.status(200).json({});
  }
  next();
})

app.use('/gallery', galleryRouter);
app.use('/images', imagesRouter);
app.use('/', authRouter);

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
})

module.exports = app;
