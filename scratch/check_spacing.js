const fs = require('fs');
const css = fs.readFileSync('public/styles.css', 'utf8').split('\n');

const magicNumberRegex = /:\s*([^;]+);/;
css.forEach((line, i) => {
  if (/(?:margin|padding|gap):/.test(line) && !line.includes('var(--space') && !line.includes('0') && !line.includes('auto')) {
    console.log((i+1) + ': ' + line.trim());
  }
});
