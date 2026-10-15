const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const css = fs.readFileSync('public/styles.css', 'utf8');

console.log('=== EMOJIS IN HTML ===');
const htmlEmojis = html.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];
console.log([...new Set(htmlEmojis)]);

console.log('=== EMOJIS IN JS ===');
const jsEmojis = js.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];
console.log([...new Set(jsEmojis)]);

console.log('=== HREF="#" IN HTML & JS ===');
console.log('HTML href="#":', (html.match(/href="#"/g) || []).length);
console.log('JS href="#":', (js.match(/href="#"/g) || []).length);

console.log('=== FORMS & BUTTONS IN JS ===');
console.log('button elements in JS:', (js.match(/<button/g) || []).length);
console.log('input elements in JS:', (js.match(/<input/g) || []).length);
console.log('form elements in JS:', (js.match(/<form/g) || []).length);
