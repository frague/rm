const request = require('request');
const querystring = require('querystring');

const env = process.env;

export default class IntegrationsCtrl {

  cookie = '';

  fillRequest(url: string, payload={}) {
    let jar = request.jar();
    jar.setCookie(this.cookie, url);
    return Object.assign({}, {url, jar, form: payload});
  }

  getAccounts = (req, res) => {
    request.get(
      this.fillRequest('https://pmo.griddynamics.net/service/account/getAccounts.action'),
      (error, response2, body) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(body);
      });
  }

  pmoLogin = (req, res) => {
    this.cookie = '';
    request.post({
      url: 'https://pmo.griddynamics.net/j_spring_security_check',
      form: {j_username: env.PMO_LOGIN, j_password: env.PMO_PASSWORD}
    })
      .on('response', response => {
        this.cookie = request.cookie(response.headers['set-cookie'][0]);
        res.sendStatus(200);
      });
  }

}