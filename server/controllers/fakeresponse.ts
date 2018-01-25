export function fakeRes(callback: Function) {
  return {
    setHeader: () => {},
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

