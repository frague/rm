const request = require('request');
const env = process.env;
const pmo = 'https://pmo.griddynamics.net/';

export default class IntegrationsCtrl {

  cookie = '';

  _fillRequest(url: string, payload={}) {
    let jar = request.jar();
    jar.setCookie(this.cookie, url);
    return Object.assign({}, {url, jar, form: payload});
  }

  _login() {
    this.cookie = '';
    return request.post({
      url: pmo + 'j_spring_security_check',
      form: {j_username: env.PMO_LOGIN, j_password: env.PMO_PASSWORD}
    })
      .on('response', response => {
        this.cookie = request.cookie(response.headers['set-cookie'][0]);
      });
  }

  pmoLogin = (req, res) => {
    this._login().then(() => res.setStatus(200));
  }

  getAccounts = (req, res) => {
    this._login().on('response', () => {
      request.get(
        this._fillRequest(pmo + 'service/account/getAccounts.action'),
        (error, response, body) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(body);
        });
    });
  }

  getPeople = (req, res) => {
    this._login().on('response', () => {
      request.get(
        this._fillRequest(pmo + 'service/people'),
        (error, response, body) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(body);
        });
    });
  }

}