const request = require('request');

const env = process.env;
const jobvite = 'https://api.jobvite.com/api/v2/';
// const jobvite = 'https://app-stg.jobvite.com/api/v2/';

export default class JobViteIntegrationsCtrl {

  _buildQueryParams = (api, sc, extras={}) => {
    if (!api || !sc) {
      throw 'No JobVite keys provided to access the candidates API';
    }
    let qs = Object.assign({}, extras, { api, sc });
    return qs;
  }

	getRequisitions = (): Promise<any> => {
		return new Promise((resolve, reject) => {
			let qs;
			try {
				qs = this._buildQueryParams(
			    env.JV_JOBS_KEY,
			    env.JV_JOBS_SECRET,
					{ jobStatus: ['Open', 'Approved', 'Draft', 'Awaiting Approval'] }
				);
			} catch (e) {
				return reject(e);
			}
	    request.get(
	      jobvite + 'job',
	      {
	        qs,
	        useQuerystring: true
	      },
	      (err, response, body) => {
	        try {
	          body = JSON.parse(body);
	          console.log('Total requisitions fetched:', body.total);
	          resolve(body.requisitions);
	        } catch (e) {
	          console.log('Requisitions parsing error', e);
	          reject(e);
	        }
	      })
	    		.on('error', error => {
	          console.log('Reqisitions fetching error', error);
	    			reject(error);
	    		});
		});

  }

  getCandidates = (start, count): Promise<any> => {
    return new Promise((resolve, reject) => {
			let qs;
			try {
				qs = this._buildQueryParams(
			    env.JV_CANDIDATES_KEY,
    			env.JV_CANDIDATES_SECRET,
					{ start, count }
				);
			} catch (e) {
				return reject(e);
			}
      request.get(
        jobvite + 'candidate',
        {
          qs,
          useQuerystring: true
        },
        (err, response, body) => {
          try {
            body = JSON.parse(body);
          } catch (e) {
            console.log('Candidates parsing error', e);
            return reject(e)
          }
          if (body.status.code !== 200) return reject(body.status.messages);
          resolve(body.candidates);
        })
      		.on('error', error => {
            console.log('Candidates fetching error', error);
            return reject(error);
      		});
    });
  }

  getCandidatesCount = (): Promise<number> => {
    return new Promise((resolve, reject) => {
			let qs;
			try {
				qs = this._buildQueryParams(
			    env.JV_CANDIDATES_KEY,
    			env.JV_CANDIDATES_SECRET,
					{ count: 1 }
				);
			} catch (e) {
				return reject(e);
			}
      request.get(
        jobvite + 'candidate',
        { qs },
        (err, response, body) => {
          try {
            body = JSON.parse(body);
            let total = body.total;
            console.log('JobVite candidates count: ' + total);
            resolve(total);
          } catch (e) {
            reject('Error parsing JobVite response');
          }
        }
      )
      	.on('error', error => {
          console.log('Unable to access JobVite candidates API', error);
          reject(error);
      	})
    });
  }

}