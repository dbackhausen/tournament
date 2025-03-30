const fs = require('fs');

const envConfig = `
window.env = {
  API_URL: "${process.env.API_URL}"
};
`;

fs.writeFile('./dist/tournament/browser/assets/env.js', envConfig, (err) => {
  if (err) {
    console.error('Error writing env.js', err);
  } else {
    console.log('Environment variables set successfully!');
  }
});
