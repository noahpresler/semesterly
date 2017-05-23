module.exports = {
	"env": {
		"browser": true,
		"node": true,
		"jasmine": true
	},
	"globals": {
	  "$": true,
		"_": true,
		"initData": true, // homepage context data passed from backend
		"reactAlertEvents": true,
		"Dashing": true,
		"twemoji": true,
	},
	rules: {
		"no-plusplus": 0,
    "jsx-a11y/no-static-element-interactions": 0
	},
	extends: "airbnb",
};