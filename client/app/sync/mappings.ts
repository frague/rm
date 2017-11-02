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

export var billabilityMap = {
  'New non-billable': 'Non-billable',
  'New billable': 'Billable',
  'Replacement': 'Billable'
};