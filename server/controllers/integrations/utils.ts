const request = require('request');

const env = process.env;

export const fillRequest = (cookie: string, url: string, payload={}): any => {
  let jar = request.jar();
  jar.setCookie(cookie, url);
  return Object.assign({}, {url, jar, form: payload});
}

export const login = (url: string, j_username: string, j_password: string) => {
  return request.post({
    url,
    form: {j_username, j_password},
    rejectUnauthorized: false,
  });
}

export const catchAwait = (promise) => {
  return promise
    .then(data => [null, data])
    .catch(err => [err]);
}