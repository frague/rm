const request = require('request');
var parser = require('xml2json');

const env = process.env;
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';

export default class BambooIntegrationsCtrl {
  _makeRequest(endpoint: string, payload={}) {
    return {
      url: 'https://' + env.BAMBOO_KEY + ':x@' + bamboo + endpoint
    };
  }

  getTimeoffs = (): Promise<any> => {
  	return new Promise((resolve, reject) => {
	    let data = [];
	    return request.get(this._makeRequest('time_off/requests/'))
	      .on('data', chunk => {
	        data.push(chunk);
	      })
	      .on('end', () => {
	        let body = parser.toJson(Buffer.concat(data).toString());
	        resolve(JSON.parse(body));
	      })
	      .on('error', error => {
	        console.log('Error getting bamboo time offs');
	        reject(error);
	      });
  	});
  };


}