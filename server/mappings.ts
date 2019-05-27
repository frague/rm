export function replaceFromMap(where, what) {
  return where[what] ? where[what] : what;
}

export var demandProfilesMap = {
  'QE-Mobile': 'Quality Engineer',
  'BSA-Common': 'Quality Engineer',
  'QE-Automation': 'Quality Engineer',
  'Analyst': 'Quality Engineer',

  'Dev-Services-ATG': 'CustomDev',
  'Dev-Services-Java': 'CustomDev',
  'Dev-Services-Other': 'CustomDev',
  'Dev-Services-Scala': 'CustomDev',
  'Dev-Services-DotNet': 'CustomDev',

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
  'DevOps Engineer': 'DevOps',

  'Dev-Search-Solr': 'Search',
  'Architect-Search': 'Search',
  'Dev-Search-Elastic': 'Search',

  'ML Engineer': 'ML',
  'ML Team Lead': 'ML',
  'BigDataEng-DataScientist': 'ML',

  'Dev-Mobile-Android': 'Mobile',

  'Manager-DM': 'Management',
};

export var demandPoolsMap = {
  "Developer-": "CustomDev",
  "Developer-.NET": "CustomDev",
  "Developer-ATG": "CustomDev",
  "Developer-Android": "Mobile",
  "Developer-BigData": "BigData",
  "Developer-Full stack": "UI",
  "Developer-Hybris": "CustomDev",
  "Developer-Java": "CustomDev",
  "Developer-ODI": "CustomDev",
  "Developer-Python": "CustomDev",
  "Developer-Ruby": "CustomDev",
  "Developer-Scala": "CustomDev",
  "Developer-Search": "Search",
  "Developer-UI": "UI",
  "Developer-iOS": "Mobile",
  "Architect-": "QA",
  "Architect-BigData": "BigData",
  "Architect-DevOps": "DevOps",
  "Architect-Platform": "CustomDev",
  "Architect-Quality": "QA",
  "Architect-Search": "Search",
  "Architect-UI": "UI",
  "Quality Engineer-": "QA",
  "Quality Engineer-Automation": "QA",
  "Quality Engineer-BigData": "QA",
  "Quality Engineer-Manual": "QA",
  "Quality Engineer-Mobile": "QA",
  "Quality Engineer-Performance": "QA",
  "Site Reliability Engineer-": "DevOps",
  "NOC Engineer-": "DevOps",
  "Data Scientist-": "ML",
  "UX Designer-": "UI",
  "Manager-": "Managers",
  "Manager-Account": "Managers",
  "Manager-Delivery": "Managers",
  "Manager-Engineering": "Managers",
  "Manager-Program": "Managers",
  "Analyst-": "QA",
  "DevOps Engineer-": "DevOps",
  "DevOps Engineer-BigData": "DevOps",
  "DevOps Engineer-Cloud": "DevOps",
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
    'Developer': ['UI', 'Full stack'],
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
  'Saint-Petersburg': 'SPB',
  'Menlo Park': 'US',
  'Belgrade': 'BEL',
  'Saratov': 'SAR',
  'Kharkov': 'KHR',
  'Wroclaw': 'WR',
  'Krakow': 'KR',
  'Kyiv': 'KY',
  'Lviv': 'LV',
};

export var locations = [
  'SPB', 'SAR', 'KHA', 'LV', 'KR', 'US', 'BEL', 'WR',
];

export var visasCols = {
  'Moscow': ['name', '', 'passport', 'type1', 'till1', 'type2|till2', 'license'],
  'Kharkiv': ['', 'name', '', 'passport', 'type1', 'till1', 'type2', 'till2', 'license'],
  'Saratov': ['name', '', 'passport', 'type1|till1', 'type2|till2', 'type3|till3', 'license'],
  'Saint-Petersburg': ['name', '', 'passport', 'type1|till1', 'type2|till2', 'type3|till3', 'license'],
  'LVIV': ['', 'name', '', 'passport', 'type1', 'till1', 'type2', 'till2', 'license'],
  'Krakw': ['', 'name', '', 'passport', 'type1', 'till1', 'license']
};

export var dePolish = {
  'Ą': 'A',
  'ą': 'a',
  'Ć': 'C',
  'Č': 'C',
  'ć': 'c',
  'č': 'c',
  'Đ': 'D',
  'đ': 'd',
  'Ę': 'E',
  'ę': 'e',
  'Ł': 'L',
  'ł': 'l',
  'Ń': 'N',
  'ń': 'n',
  'Ó': 'O',
  'ó': 'o',
  'Ś': 'S',
  'Š': 'S',
  'ś': 's',
  'š': 's',
  'Ź': 'Z',
  'Ż': 'Z',
  'Ž': 'Z',
  'ź': 'z',
  'ż': 'z',
  'ž': 'z',
};

export const requisitionsStates = [
  'Open',
  'Approved',
  'Draft',
  'Awaiting Approval',
  'Filled'
];

export const requisitionsAvailability = [
  'External',
  'Internal',
  'Limited Access'
];

export const requisitionsLocations = {
  'All Offshore': 'BEL, KHR, KR, LV, SAR, SPB, WR',
  'Belgrade, Serbia': 'BEL',
  'Kharkov, Ukraine': 'KHR',
  'Krakow, Poland': 'KR',
  'Wroclaw, Poland': 'WR',
  'Lviv, Ukraine': 'LV',
  'Kyiv, Ukraine': 'KY',
  'Saratov, Russia': 'SAR',
  'St. Petersburg, Russia': 'SPB',
  'Atlanta, GA, US': 'US',
  'Austin, TX, US': 'US',
  'Cork, Ireland': 'US',
  'Cupertino, CA, US': 'US',
  'Dallas, TX, US': 'US',
  'Houston, TX, US': 'US',
  'Irving, TX, US': 'US',
  'Madison, WI, US': 'US',
  'Milpitas, CA, US': 'US',
  'Milwaukee, WI, US': 'US',
  'Mountain View, CA, US': 'US',
  'New York City, NY, US': 'US',
  'Phoenix, AZ': 'US',
  'Pittsburgh, PA, US': 'US',
  'Pleasanton, CA, US': 'US',
  'Redwood City, CA, US': 'US',
  'San Francisco, CA, US': 'US',
  'San Ramon, CA, US': 'US',
  'Sunnyvale, CA, US': 'US',
};

export const candidateStates = {
  // 'Pre-Screening Test': '01 Prescreening',
  // 'Screened': '02 Screened',
  // 'Submitted to Interviewers': '03 Interview',
  // 'Approved by Interviewers by CV': '04 Approved by CV',
  // 'Submitted to Hiring Manager': '05 Passed to HM',
  // 'Approved by Hiring Manager': '06 Approved by HM',
  'HR Interview': '07 HR Interview',
  'Technical Interview': '08 Tech. Interview',
  'Non-Technical Interview': '09 Non-Tech. Interview',
  'Recommended for Hiring': '10 Hiring Recommended',
  'Offer Generation': '11 Offer Generation',
  'Offer Sent': '12 Offer Sent',
  'Offer Accepted': '13 Offer Accepted',
  'Hired': '14 Hired',
};

export const demandStatusesMap = {
  'Active': 'Open',
  'Softbooked': 'Open',
  'Staffed internally': 'Filled',
  'Staffed externally': 'Filled'
};