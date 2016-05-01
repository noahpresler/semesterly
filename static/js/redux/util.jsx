export const randomString = (length = 30, chars = "!?()*&^%$#@![]0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
const browserSupportsLocalStorage = () => {
	try {
		localStorage.setItem("test", "test");
		localStorage.removeItem("test");
		return true;
	} catch (exception) {
		return false;
	}
}
export const saveLocalTimetable = (courseSections, active) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("courseSections", JSON.stringify(courseSections));
	localStorage.setItem("active", active);
}
export const getLocalTimetable = () => {
	if (!browserSupportsLocalStorage()) { return {}; }
	try {
		return {
			courseSections: JSON.parse(localStorage.getItem("courseSections")),
			active:  localStorage.getItem("active")
		};
	} catch (exception) {
		return {};
	}
}
