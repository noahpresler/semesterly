require('babel-core/register');
require('babel-polyfill');
const searchneu = require('searchneu');
const path = require('path');
const fs = require('fs');

searchneu.default.main(true).then((retVal) => {
  const semesterlyString = JSON.stringify(retVal, null, 4);
  fs.writeFile(path.join(__dirname, 'data', 'courses.json'), semesterlyString, (err) => {
    if (err) {
      global.console.log(err);
      return;
    }

    global.console.log('saved semesterly data');
  });
}).catch((err) => {
  global.console.log(err);
});
