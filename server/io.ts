import * as socketIO from 'socket.io';

var client = null;

export var IO = {
  client: () => client,
  initialize: server => {
    client = socketIO(server);
  }
}
