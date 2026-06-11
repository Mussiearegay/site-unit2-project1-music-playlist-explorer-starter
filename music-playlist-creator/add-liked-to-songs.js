// Script to add 'liked: false' to all songs in data.js
const fs = require('fs');

const filePath = './data/data.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add liked: false to all songs (after duration property)
content = content.replace(
  /duration: "(\d+:\d+)"/g,
  'duration: "$1",\n        liked: false'
);

// Remove duplicate liked properties (in case already exists)
content = content.replace(/liked: false,\s+liked: false/g, 'liked: false');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added liked property to all songs!');
