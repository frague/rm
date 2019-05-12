const request = require('request');

const env = process.env;
const sso = 'https://sso.griddynamics.net/auth/token/ldap';
var ssoHeader = null;

export const fillRequest = (cookie: string, url: string, payload={}): any => {
  console.log('URL', url);
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

const ssoLogin = (): Promise<any> => {
  return new Promise((resolve, reject) =>
    postJson(
      sso,
      {
        userName: env.CONFLUENCE_LOGIN,
        encodedPassword: Buffer.from(env.CONFLUENCE_PASSWORD).toString('base64')
      },
      (err, response, body) => {
        console.log('SSO authentication...');
        if (err) {
          console.log('   error');
          return reject('Error logging in via SSO');
        }
        console.log('   successful');
        resolve({
          headers: {
            Authorization: 'Bearer ' + body.accessToken
          }
        });
      }
    )
  )
}

export const ssoQuery = (url: string, options: any = null): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    if (!ssoHeader) {
      let _error;
      ssoHeader = await ssoLogin().catch(error => _error = error);
      if (_error) return reject(_error);
    }

    let opts = Object.assign({url}, ssoHeader, options);

    console.log('SSO query: ', opts);

    request[options ? 'post' : 'get'](
      opts,
      (err, response, body) => {
        if (!body && response && response.toJSON) {
          body = response.toJSON().body;
        }
        let data;
        try {
          data = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (error) {
          console.log('Error decoding json', body);
          return reject(error);
        }
        resolve(data);
      })
        .on('error', error => {
          console.log('Error making SSO-authenticated request to ' + url, error);
          reject(error);
        });
  });
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