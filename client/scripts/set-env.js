const fs = require('fs');
const targetPath = './dist/tournament/browser/assets/env.js';

const envConfig = `
window.env = {
  API_URL: "${process.env.API_URL || 'http://localhost:8080/api/'}"
};
`;

fs.writeFile(targetPath, envConfig, (err) => {
  if (err) {
    console.error('Error writing env.js', err);
  } else {
    console.log('Environment variables set successfully at ' + targetPath);
  }
});
