export const randomString = (length = 30, chars = "!?()*&^%$#@![]0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
export const browserSupportsLocalStorage = () => {
	try {
		localStorage.setItem("test", "test");
		localStorage.removeItem("test");
		return true;
	} catch (exception) {
		return false;
	}
}
export const saveLocalCourseSections = (courseSections) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("courseSections", JSON.stringify(courseSections));
}
export const saveLocalActiveIndex = (activeIndex) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("active", activeIndex);
}
export const saveLocalPreferences = (preferences) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("preferences", JSON.stringify(preferences));
}
export const saveLocalSemester = (semester) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("semester", semester);
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
