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
		"no-plusplus": 0,
    "jsx-a11y/no-static-element-interactions": 0,
		"jsx-a11y/no-noninteractive-element-interactions": 0,
		"react/jsx-max-props-per-line": 0
	},
	extends: "airbnb",
};