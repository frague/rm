const request = require('request');
var parser = require('xml2json');

const env = process.env;
const bamboo = 'api.bamboohr.com/api/gateway.php/griddynamics/v1/';

export default class BambooIntegrationsCtrl {
  private _makeRequest(endpoint: string) {
    return {
      url: 'https://' + env.BAMBOO_KEY + ':x@' + bamboo + endpoint
    };
  }

  private _makeOptions(endpoint: string, body: string = ''): object {
    return Object.assign(
      this._makeRequest(`${endpoint}?format=JSON`),
      {
        headers: {'Accept': 'application/json'},
        body: body.replace(/>\s+</g, '><')
      }
    );
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
      let options = this._makeOptions(
        'reports/custom/',
        `<report>
          <title>PR report</title>
          <fields>
            <field id="customUsername" />
            <field id="customPerformanceReviewDue" />
            <field id="payRate" />
            <field id="dateOfBirth" />
          </fields>
        </report>`
      );
      request.post(options, (err, response, body) => resolve(body)).on('error', reject);
    });
  }

  private _getEmployeeTable = (employeeId: string, table: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      request.get(
        this._makeOptions(`employees/${employeeId}/tables/${table}`),
        (err, response, body) => resolve(JSON.parse(body))
      )
      .on('error', reject);
    });
  }

  getEmployeeJobInfo = (employeeId: string): Promise<any> => {
    return this._getEmployeeTable(employeeId, 'jobInfo');
  }

  getEmployeeCompensations = (employeeId: string): Promise<any> => {
    return this._getEmployeeTable(employeeId, 'compensation')
      .then(table => table.sort((a, b) => (a.startDate > b.startDate) ? -1 : 1));
  }

  getEmployeeGrades = (employeeId: string): Promise<any> => {
    return this._getEmployeeTable(employeeId, 'customGrade1');
  }

  getCarreer = (req, res) => {
    let { bambooId } = req.params;
    if (bambooId != +bambooId) {
      return res.sendStatus(500);
    }

    Promise.all([
      this.getEmployeeJobInfo(bambooId),
      this.getEmployeeCompensations(bambooId),
      this.getEmployeeGrades(bambooId)
    ])
      .then(([jobs, compensations, grades]) => {
        res.setHeader('Content-Type', 'application/json');
        res.json({jobs, compensations, grades: grades[0]});
      })
      .catch(err => res.sendStatus(500));
  }
}