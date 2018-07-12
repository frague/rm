const request = require('request');
import { requisitionsStates, requisitionsAvailability, candidateStates } from '../../mappings';
// request.debug = true;

const env = process.env;
const jobvite = 'https://api.jobvite.com/api/v2/';
// const jobvite = 'https://app-stg.jobvite.com/api/v2/';

export default class JobViteIntegrationsCtrl {

  _buildQueryParams = (api, sc, extras={}) => {
    if (!api || !sc) {
      throw 'No JobVite keys provided to access the API';
    }
    let qs = Object.assign({}, extras, { api, sc });
    return qs;
  }

  getRequisitionsCount = async (): Promise<number> => {
    let [, count] = await this.getRequisitions(0, 1);
    return count;
  }

	_getItems = (item: string, params: any, resultKey: string): Promise<[any, number]> => {
		return new Promise((resolve, reject) => {
	    request.get(
	      jobvite + item,
	      {
	        qs: params,
	        useQuerystring: true
	      },
	      (err, response, body) => {
          // const diapasone = '[' + params.start + '÷' + (params.start + params.count) + ']';
          try {
	          body = JSON.parse(body);
	        } catch (e) {
	          console.log(item + 's parsing error', e);
	          return reject(e);
	        }
          if (body.status.code !== 200) {
            console.log('Error:', JSON.stringify(body.status.messages), body.status.code);
            return reject(body.status.messages);
          }
          // console.log(item + 's chunk fetched ' + diapasone);
          resolve([body[resultKey], +body.total]);
	      })
	    		.on('error', error => {
	          console.log(item + 's fetching error', error);
	    			reject(error);
	    		});
		});
  }

  getRequisitions = (start: number, count=500): Promise<[any, number]> => {
    if (start < 1) start = 1;
    let params;
    try {
      params = this._buildQueryParams(
        env.JV_JOBS_KEY,
        env.JV_JOBS_SECRET,
        {
          jobStatus: requisitionsStates,
          availableTo: requisitionsAvailability,
          start,
          count,
          sortBy: 'requisitionId'
        }
      );
    } catch (e) {
      console.log('Error', e);
      return Promise.reject(e);
    }
    return this._getItems('job', params, 'requisitions');
  };

  getCandidates = (start: number, count=500): Promise<[any, number]> => {
    if (start < 1) start = 1;
		let params;
		try {
			params = this._buildQueryParams(
		    env.JV_CANDIDATES_KEY,
  			env.JV_CANDIDATES_SECRET,
				{
          wflowstate: Object.keys(candidateStates),
          start,
          count
        }
			);
		} catch (e) {
			return Promise.reject(e);
		}
    return this._getItems('candidate', params, 'candidates');
 }

  getCandidatesCount = async (): Promise<number> => {
    let [, count] = await this.getCandidates(0, 1);
    return count;
  }
}