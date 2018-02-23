export function fakeRes(callback: Function) {
  return {
    setHeader: () => {},
    sendStatus: code => {
      code === 500 ? callback(null, true) : callback(null)
    },
    send: (data, err) => {
      // console.log('Text', data);
      callback(JSON.parse(data), err);
    },
    json: (data, err) => {
      // console.log('JSON', data);
      callback(data, err);
    }
  };
}

