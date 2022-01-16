/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

module.exports = {
	"env": {
		"browser": true,
		"node": true,
		"jasmine": true
	},
	"globals": {
	  "$": true,
		"initData": true, // homepage context data passed from backend
		"reactAlertEvents": true,
	},
	rules: {
		"no-else-return": 0,
		"no-plusplus": 0,
	    "jsx-a11y/no-static-element-interactions": 0,
		"jsx-a11y/no-noninteractive-element-interactions": 0,
		"react/jsx-max-props-per-line": 0,
		"import/first": 0
	},
	extends: "airbnb",
};