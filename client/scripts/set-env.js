const fs = require('fs');
const targetPath = './src/assets/env.js';

const envConfigFile = `
(function (window) {
  window.env = {
    API_URL: '${process.env.API_URL || 'http://localhost:8080/api/'}'
  };
})(this);
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error creating env.js file', err);
  } else {
    console.log(`env.js file created at ${targetPath}`);
  }
});
