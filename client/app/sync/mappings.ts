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
  'Account Director': [''],
  'Account Success Manager': [''],
  'Architect': ['', 'UI', 'BigData'],
  'Business/System Analyst': [''],
  'Data Scientist': [''],
  'Delivery Director': [''],
  'Delivery Manager': ['', 'BigData', 'Search'],
  'DevOps': ['', 'BigData'],
  'Developer': ['Java', 'BigData', 'UI', '.NET', 'Python', 'Search', 'Android', 'iOS', 'Oracle ODI', 'Ruby'],
  'NOC Engineer': [''],
  'Quality Engineer': ['Automation', 'BigData', 'Manual'],
  'Site Reliability Engineer': [''],
  'UX Designer': ['']
};

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