import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as httpServer from 'http';

import { IO } from './io';
import setRoutes from './routes';

require('dotenv').config();  // Puts .env contents to Environment variables

const app = express();
app.set('port', (process.env.PORT || 3030));

app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json({limit: '1mb', extended: true}));  // Parses request responses to body
app.use(bodyParser.urlencoded({limit: '1mb', extended: true})); // ...

app.use(morgan('dev'));  // Requests logging middleware

const mongoOptions = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

if (process.env.NODE_ENV === 'test') {
  mongoose.connect(process.env.MONGODB_TEST_URI, mongoOptions);
} else {
  mongoose.connect(process.env.MONGODB_URI, mongoOptions);
}
mongoose.set('useCreateIndex', true);

const server = httpServer.createServer(app);
IO.initialize(server);

const db = mongoose.connection;
(<any>mongoose).Promise = global.Promise;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');

  setRoutes(app);

  app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  if (!module.parent) {
    server.listen(app.get('port'), () => {
      console.log('Server is started on localhost:' + app.get('port'));
    });

    IO.client().on('connection', socket => {
      console.log('Socket connected');
      socket.emit('status', {connected: true});
    });
  }

});


export { app };
