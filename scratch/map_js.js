const fs = require('fs');
const js = fs.readFileSync('public/app.js', 'utf8');

const lines = js.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((l, i) => {
  if (l.startsWith('function ') || l.startsWith('const ') && l.includes('=>') || l.startsWith('async function')) {
    console.log((i+1) + ': ' + l.slice(0, 80));
  }
});
