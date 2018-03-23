export function replaceFromMap(where, what) {
  return where[what] ? where[what] : what;
}

export var accountsMap = {
  'American Eagle Outfitters': 'AEO',
  'Blackhawk Network': '',
  'GAP': '',
  'Hearst': '',
  'Integral Ad Science': '',
  'Jump Ramp Games': '',
  'KOHL\'s': 'Kohls',
  'MACY\'s': 'Macys',
  'Rally Health': '',
  'Sephora': '',
  'Silicon Valley Bank': '',
  'Toys R Us': 'ToysRUs'
};

export var demandProfilesMap = {
  'QE-Mobile': 'QA',
  'BSA-Common': 'QA',
  'QE-Automation': 'QA',

  'Dev-Services-ATG': 'Custom Dev',
  'Dev-Services-Java': 'Custom Dev',
  'Dev-Services-Other': 'Custom Dev',
  'Dev-Services-Scala': 'Custom Dev',
  'Dev-Services-DotNet': 'Custom Dev',

  'Dev-Services-Node': 'UI',
  'Dev-UI-FullStack': 'UI',
  'Dev-UI-Angular2': 'UI',
  'Dev-UI-Common': 'UI',
  'Dev-UI-DotNet': 'UI',
  'Dev-UI-React': 'UI',
  'Architect-UI': 'UI',

  'BigDataEng-Dev': 'BigData',
  'Architect-BigData': 'BigData',

  'DevOps-NOC': 'DevOps',
  'DevOps-CICD': 'DevOps',
  'DevOps-Cloud': 'DevOps',
  'DevOps-BigData': 'DevOps',
  'Architect-CICD': 'DevOps',

  'Dev-Search-Solr': 'Search',
  'Architect-Search': 'Search',
  'Dev-Search-Elastic': 'Search',

  'ML Engineer': 'ML',
  'BigDataEng-DataScientist': 'ML',

  'Dev-Mobile-Android': 'Mobile'
};

export var profilesMap = {
  'QA': {
    'Quality Engineer': [],
    'Site Reliability Engineer': ['']
  },
  'DevOps': {
    'DevOps': ['', 'BigData', 'CICD', 'Cloud', 'NOC']
  },
  'Custom Dev': {
    'Developer': ['Java', '.NET', 'Python', 'Oracle ODI', 'Ruby', 'Scala']
  },
  'BigData': {
    'Developer': ['BigData'],
    'Architect': ['BigData'],
    'Delivery Manager': ['BigData']
  },
  'Search': {
    'Developer': ['Search'],
    'Delivery Manager': ['Search'],
  },
  'ML': {
    'Data Scientist': ['', 'BigData'],
  },
  'UI': {
    'Architect': ['UI'],
    'Developer': ['UI'],
    'UX Designer': ['']
  },
  'Mobile': {
    'Developer': ['Android', 'iOS']
  }
};


export var profilesInvertedMap = (() => {
  return Object.keys(profilesMap).reduce((result, key) => {
    Object.keys(profilesMap[key]).forEach(profile => {
      if (!result[profile]) result[profile] = {};
      profilesMap[key][profile].forEach(specialization => result[profile][specialization] = key);
    });
    return result;
  }, {});
})();

export var billabilityMap = {
  'New non-billable': 'Non-billable',
  'New billable': 'Billable',
  'Replacement': 'Billable'
};

export var months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export var locationsMap = {
  'Saratov': 'SAR',
  'Saint-Petersburg': 'SPB',
  'Menlo Park': 'MP',
  'Kharkov': 'KHR',
  'Krakow': 'KR',
  'Lviv': 'LV',
  'Belgrade': 'BEL'
};

export var locations = [
  'SPB', 'SAR', 'KHA', 'LV', 'KR', 'US', 'BEL'
];

export var visasCols = {
  'Moscow': ['name', '', 'passport', '', 'visaB', '', 'license'],
  'Kharkiv': ['', 'name', '', 'passport', '', 'visaB', '', 'visaL', 'license'],
  'Saratov': ['name', '', 'passport', 'visaB', 'visaL', '', 'license'],
  'Saint-Petersburg': ['name', '', 'passport', 'visaB', 'visaL', '', 'license'],
  'LVIV': ['', 'name', '', 'passport', '', 'visaB', '', 'visaL', 'license'],
  'Krakw': ['', 'name', '', 'passport', 'visasType', 'visasExpirations', 'license']
};

export var dePolish = {
  'Ą': 'A',
  'ą': 'a',
  'Ć': 'C',
  'ć': 'c',
  'Ę': 'E',
  'ę': 'e',
  'Ł': 'L',
  'ł': 'l',
  'Ń': 'N',
  'ń': 'n',
  'Ó': 'O',
  'ó': 'o',
  'Ś': 'S',
  'ś': 's',
  'Ź': 'Z',
  'ź': 'z',
  'Ż': 'Z',
  'ż': 'z'
};

export var candidateStates = {
  'New': '01 New',
  'Screened': '02 Screened',
  'Submitted to Interviewers': '03 Interview',
  'Approved by Interviewers by CV': '04 Approved by CV',
  'Submitted to Hiring Manager': '05 Passed to HM',
  'Approved by Hiring Manager': '06 Approved by HM',
  'HR Interview': '07 HR Interview',
  'Technical Interview': '08 Tech. Interview',
  'Non-Technical Interview': '09 Non-Tech. Interview',
  'Recommended for Hiring': '10 Hiring Recommended',
  'Offer Generation': '11 Offer Generation',
  'Offer Accepted': '12 Offer Accepted'
};