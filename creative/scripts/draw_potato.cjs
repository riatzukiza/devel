const fs = require('fs');

const svg = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Potato Body -->
  <path d="M50,100 C50,60 80,50 110,60 C140,70 150,90 150,110 C150,130 130,150 100,150 C70,150 50,130 50,100 Z" 
        fill="#B8860B" stroke="#8B4513" stroke-width="3" />
  
  <!-- Little potato eyes/spots -->
  <circle cx="70" cy="85" r="2" fill="#5C4033" />
  <circle cx="110" cy="75" r="2" fill="#5C4033" />
  <circle cx="120" cy="110" r="2" fill="#5C4033" />
  <circle cx="80" cy="120" r="2" fill="#5C4033" />
  <circle cx="100" cy="100" r="2" fill="#5C4033" />
  
  <text x="60" y="170" font-family="Arial" font-size="14" fill="#333">Node-Generated Potato</text>
</svg>
`;

fs.writeFileSync('potato.svg', svg);
console.log('Potato rendered to potato.svg');
