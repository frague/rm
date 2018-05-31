const request = require('request');
var parser = require('xml2json');

const env = process.env;
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';

export default class BambooIntegrationsCtrl {
  _makeRequest(endpoint: string) {
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

  getPRs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let options = Object.assign(
        this._makeRequest('reports/custom/?format=JSON'),
        {
          headers: {'Accept': 'application/json'},
          body: `<report>
            <title>PR report</title>
            <fields>
              <field id="customUsername" />
              <field id="customPerformanceReviewDue" />
              <field id="payRate" />
            </fields>
          </report>`.replace(/>[\s\n\r]+</g, '><')
        }
      );
      request.post(options, (err, response, body) => resolve(body)).on('error', reject);
    });
  }

  getAll = (req, res) => {
    this.getPRs()
      .then(doc => {
        res.setHeader('Content-Type', 'application/json');
        res.send(doc);
      })
      .catch(error => res.sendStatus(500));
  }
}