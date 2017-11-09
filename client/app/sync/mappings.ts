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
  'Toys R Us': ''
};

export var profilesMap = {
  'QA': {
    'Quality Engineer': []
  },
  'DevOps': {
    'DevOps': ['', 'BigData']
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