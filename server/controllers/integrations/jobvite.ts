const request = require('request');
import { candidateStates } from '../../mappings';

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

  getRequisitionsCount = async (): Promise<number> => {
    let [, count] = await this.getRequisitions(0, 1);
    return count;
  }

	getRequisitions = (start: number, count=500): Promise<[any, number]> => {
		return new Promise((resolve, reject) => {
      if (start < 1) start = 1;
			let qs;
			try {
				qs = this._buildQueryParams(
			    env.JV_JOBS_KEY,
			    env.JV_JOBS_SECRET,
          {
            jobStatus: ['Open', 'Approved', 'Draft', 'Awaiting Approval', 'Filled'],
            start,
            count
          }
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
            const diapasone = '[' + start + '÷' + (start + count) + ']';
	          body = JSON.parse(body);
	          console.log('Requisitions chunk fetched ' + diapasone);
	          resolve([body.requisitions, +body.total]);
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
					{
            wflowstate: Object.keys(candidateStates),
            start,
            count
          }
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
          resolve([body.candidates, +body.total]);
        })
      		.on('error', error => {
            console.log('Candidates fetching error', error);
            return reject(error);
      		});
    });
  }

  getCandidatesCount = async (): Promise<number> => {
    let [, count] = await this.getCandidates(0, 1);
    return count;
  }

}