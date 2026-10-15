const fs = require('fs');
const js = fs.readFileSync('public/app.js', 'utf8').split('\n');

js.forEach((line, i) => {
  if (/[\u{1F300}-\u{1FAFF}]/u.test(line)) {
    console.log((i+1) + ': ' + line.trim().slice(0, 100));
  }
});
