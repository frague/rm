const request = require('request');

const env = process.env;
const sso = 'https://sso.griddynamics.net/auth/token/ldap';

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

export const ssoLogin = (): Promise<any> => {
  return new Promise((resolve, reject) =>
    postJson(
      sso,
      {
        userName: env.CONFLUENCE_LOGIN,
        encodedPassword: Buffer.from(env.CONFLUENCE_PASSWORD).toString('base64')
      },
      (err, response, body) => {
        console.log('SSO authentication');
        if (err) {
          return reject('Error logging in via SSO');
        }
        resolve({
          headers: {
            Authorization: 'Bearer ' + body.accessToken
          }
        });
      }
    )
  )
}

export const sendJson = (data: Object, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
}

export const postJson = (url: string, json: Object, handler: Function) => {
  return request.post(
    url,
    { json },
    handler
  );
}