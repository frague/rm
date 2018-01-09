import * as socketIO from 'socket.io';

var client = null;

export var IO = {
  client: () => client,
  initialize: server => {
    console.log(this.client);
    client = socketIO(server);
  }
}
