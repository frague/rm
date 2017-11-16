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
  'QE-Automation': 'QA',
  'QE-Mobile': 'QA',
  'BSA-Common': 'QA',

  'Dev-Search-Elastic': 'Custom Dev',
  'Dev-Search-Solr': 'Custom Dev',
  'Dev-Services-ATG': 'Custom Dev',
  'Dev-Services-DotNet': 'Custom Dev',
  'Dev-Services-Java': 'Custom Dev',
  'Dev-Services-Other': 'Custom Dev',
  'Dev-Services-Scala': 'Custom Dev',

  'Dev-Services-Node': 'UI',
  'Dev-UI-Angular2': 'UI',
  'Dev-UI-Common': 'UI',
  'Dev-UI-React': 'UI',

  'Architect-BigData': 'BigData',
  'BigDataEng-Dev': 'BigData',

  'DevOps-CICD': 'DevOps',
  'DevOps-Cloud': 'DevOps',
  'DevOps-NOC': 'DevOps',
  'DevOps-BigData': 'DevOps',
  'Architect-CICD': 'DevOps',

  'Architect-Search': 'Search',

  'BigDataEng-DataScientist': 'Machine Learning',
  'ML Engineer': 'Machine Learning',

  'Dev-Mobile-Android': 'Mobile'
};

export var profilesMap = {
  'QA': {
    'Quality Engineer': []
  },
  'DevOps': {
    'DevOps': ['', 'BigData', 'CICD', 'Cloud', 'NOC']
  },
  'Custom Dev': {
    'Developer': ['Java', '.NET', 'Python', 'Oracle ODI', 'Ruby']
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
  'Machine Learning': {
    'Data Scientist': [''],
  },
  'UI': {
    'Architect': ['UI'],
    'Developer': ['UI'],
    'UX Designer': [''],
    'Site Reliability Engineer': ['']
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
  'Lviv': 'LV'
};

export var locations = [
  'SPB', 'SAR', 'KHA', 'LV', 'KR', 'US'
];