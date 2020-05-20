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
  let payload = {
    userName: env.INGRID_LOGIN,
    encodedPassword: env.INGRID_PASSWORD_BASE64,
    // encodedPassword: Buffer.from(env.INGRID_PASSWORD).toString('base64')
  };
  return new Promise((resolve, reject) =>
    postJson(
      sso,
      payload,
      (err, response, body) => {
        console.log('SSO authentication...');
        if (err || !body.accessToken) {
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

export const ssoQuery = (url: string, options: any = null, isRecurred=false): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    let hasAuthenticated = false;
    if (!ssoHeader) {
      hasAuthenticated = true;
      let _error;
      ssoHeader = await ssoLogin().catch(error => _error = error);
      if (_error) return reject(_error);
    }

    let opts = Object.assign({url}, options, ssoHeader);
    if (options && options.headers) {
      opts.headers = Object.assign(opts.headers, options.headers);
    }

    console.log('SSO query: ', url);

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

        if ((data && data.status === 401) || (response && response.statusCode === 401)) {
          if (!hasAuthenticated && !isRecurred) {
            console.log('!!!! Reauthenticate');
            ssoHeader = null;
            return ssoQuery(url, options, true)
              .then(data => resolve(data))
              .catch(error => reject(error));
          } else {
            console.log('!!! Not authenticated error!');
            reject(401);
          }
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