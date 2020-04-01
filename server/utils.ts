export const printTitle = (title: string) => {
  let l = title.length;
  console.log(`\n- ${title} ${'-'.repeat(100-l)}`);
}

export const getDeepProperty = (source: any, path: string): any => {
  return path.split('.').reduce((result: any, level: string) => {
    if (!result || !result[level]) throw(`Unable to find value in the path ${path}`);
    return result[level];
  }, source);
}

