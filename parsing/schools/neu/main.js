require("babel-core/register");
require("babel-polyfill");
var searchneu = require('searchneu')
var path = require('path')
var fs = require('fs')


searchneu.default.main(true).then(function(retVal) {
    let semesterlyString = JSON.stringify(retVal, null, 4)
    fs.writeFile(path.join(__dirname, 'data', 'courses.json'), semesterlyString, function (err) {
	    if (err) {
	    	console.log(err)
	    	return;
	    }

	    console.log('saved semesterly data')
    })
}).catch(function (err) {
	console.log(err)
})
