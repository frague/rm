export function replaceFromMap(where, what) {
  return where[what] ? where[what] : what;
}

export function formatDate(date: Date): string {
  let d = new Date(date);
  return d.toISOString().substr(0, 10);
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
  'Developer-': 'CustomDev',
  'Developer-.NET': 'CustomDev',
  'Developer-ATG': 'CustomDev',
  'Developer-Android': 'Mobile',
  'Developer-BigData': 'BigData',
  'Developer-Full stack': 'UI',
  'Developer-Hybris': 'CustomDev',
  'Developer-Java': 'CustomDev',
  'Developer-ODI': 'CustomDev',
  'Developer-Python': 'CustomDev',
  'Developer-Ruby': 'CustomDev',
  'Developer-Scala': 'CustomDev',
  'Developer-Search': 'Search',
  'Developer-UI': 'UI',
  'Developer-iOS': 'Mobile',
  'Architect-': 'QA',
  'Architect-BigData': 'BigData',
  'Architect-DevOps': 'DevOps',
  'Architect-Platform': 'CustomDev',
  'Architect-Quality': 'QA',
  'Architect-Search': 'Search',
  'Architect-UI': 'UI',
  'Quality Engineer-': 'QA',
  'Quality Engineer-Automation': 'QA',
  'Quality Engineer-BigData': 'QA',
  'Quality Engineer-Manual': 'QA',
  'Quality Engineer-Mobile': 'QA',
  'Quality Engineer-Performance': 'QA',
  'Site Reliability Engineer-': 'DevOps',
  'NOC Engineer-': 'DevOps',
  'Data Scientist-': 'ML',
  'UX Designer-': 'UI',
  'Manager-': 'Managers',
  'Manager-Account': 'Managers',
  'Manager-Delivery': 'Managers',
  'Manager-Engineering': 'Managers',
  'Manager-Program': 'Managers',
  'Analyst-': 'QA',
  'DevOps Engineer-': 'DevOps',
  'DevOps Engineer-BigData': 'DevOps',
  'DevOps Engineer-Cloud': 'DevOps',
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
    'ML Engineer': [''],
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

const locations = {
  BEL: 'BEL',
  KHR: 'KHR',
  KY: 'KY',
  LV: 'LV',
  SAR: 'SAR',
  SPB: 'SPB',
  KR: 'KR',
  WR: 'WR',
  US: 'US',
};

const allOffshore = [locations.BEL, locations.KHR, locations.KR, locations.KY, locations.LV, locations.SAR, locations.SPB, locations.WR];

export var locationsMap = {
  'Saint-Petersburg': locations.SPB,
  'SPb': locations.SPB,
  'HQ': locations.US,
  'San Ramon': locations.US,
  'Menlo Park': locations.US,
  'Belgrade': locations.BEL,
  'Saratov': locations.SAR,
  'Kharkov': locations.KHR,
  'Wroclaw': locations.WR,
  'Krakow': locations.KR,
  'Kyiv': locations.KY,
  'Lviv': locations.LV,
  '.Offshore General': allOffshore,
  '.Poland General': [locations.KR, locations.WR],
  '.Serbia General': [locations.BEL],
  '.US General': locations.US,
  '.Ukraine General': [locations.KHR, locations.LV, locations.KY],
  '.Russia General': [locations.SAR, locations.SPB],
};

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
  'All Offshore': allOffshore.join(', '),
  'Belgrade, Serbia': locations.BEL,
  'Kharkov, Ukraine': locations.KHR,
  'Krakow, Poland': locations.KR,
  'Wroclaw, Poland': locations.WR,
  'Lviv, Ukraine': locations.LV,
  'Kyiv, Ukraine': locations.KY,
  'Saratov, Russia': locations.SAR,
  'St. Petersburg, Russia': locations.SPB,
  'Atlanta, GA, US': locations.US,
  'Austin, TX, US': locations.US,
  'Cork, Ireland': locations.US,
  'Cupertino, CA, US': locations.US,
  'Dallas, TX, US': locations.US,
  'Houston, TX, US': locations.US,
  'Irving, TX, US': locations.US,
  'Madison, WI, US': locations.US,
  'Milpitas, CA, US': locations.US,
  'Milwaukee, WI, US': locations.US,
  'Mountain View, CA, US': locations.US,
  'New York City, NY, US': locations.US,
  'Phoenix, AZ': locations.US,
  'Pittsburgh, PA, US': locations.US,
  'Pleasanton, CA, US': locations.US,
  'Redwood City, CA, US': locations.US,
  'San Francisco, CA, US': locations.US,
  'San Ramon, CA, US': locations.US,
  'Sunnyvale, CA, US': locations.US,
};

export const candidateStates = {
  // 'Screened': '01 Screened',
  // 'On Hold': '02 On Hold',
  'Submitted to Interviewers': '03 Submitted to Interviewers',
  'Approved by Interviewers by CV': '04 Approved by Interviewers by CV',
  'Submitted to Hiring Manager': '05 Submitted to Hiring Manager',
  'Approved by Hiring Manager': '06 Approved by Hiring Manager',
  // 'Phone Screen': '07 Phone Screen',
  // 'HR Interview - US': '08 HR Interview - US',
  'HR Interview - Non US': '08 HR Interview - Non US',
  // 'Video Screen': '09 Video Screen',
  // 'CV Technical Screening': '10 CV Technical Screening',
  // 'Pre-Screening Test': '11 Pre-Screening Test',
  'Technical Interview': '12 Technical Interview',
  'Non-Technical Interview': '13 NTI',
  'Client Interview': '14 CI',
  'Recommended for Hiring': '15 Recommended',
  'Pending Approval': '16 Pending Approval',
  'Approved': '17 Approved',
  'Offer Generation': '18 Offer Generation',
  'Offer Sent': '19 Offer Sent',
  'Offer Accepted': '20 Offer Accepted',
  'Internal Hired': '21 Internal Hired',
  'Hired': '22 Hired'
};

export const demandStatusesMap = {
  'Active': 'Open',
  'Softbooked': 'Open',
  'Staffed internally': 'Filled',
  'Staffed externally': 'Filled'
};

export const stagesMap = {
  'Fully Confirmed': 'FC',
  'Verbally Agreed': 'VA',
  'Sales Prospect': 'SP',
};