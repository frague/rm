export const printTitle = (title: string) => {
  let l = title.length;
  console.log(`\n- ${title} ${'-'.repeat(100-l)}`);
}

