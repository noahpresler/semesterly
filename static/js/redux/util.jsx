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
export const setFirstVisit = (time) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("firstVisit", time);
}
export const setFriendsCookie = (time) => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.setItem("friendsCookie", time);
}
export const setDeclinedNotifications = (declined) => {
	if (!browserSupportsLocalStorage()) { return; }
	// console.log("settings decline", declined);
	localStorage.setItem("declinedNotifications", declined);
}
export const getDeclinedNotifications = () => {
	if (!browserSupportsLocalStorage()) { return; }
	localStorage.getItem("declinedNotifications");
}
export const timeLapsedGreaterThan = (time, days) => {
	if (!browserSupportsLocalStorage()) { return; }
	let timeNow = new Date();
	let windowInMilli = 1000 * 60 * 60 * 24 * days;
	// console.log(timeNow.getTime(), Number(time), windowInMilli);
	return ((timeNow.getTime() - Number(time)) > windowInMilli);
}
export const getLocalTimetable = () => {
	if (!browserSupportsLocalStorage()) { return {}; }
	try {
		return {
			courseSections: JSON.parse(localStorage.getItem("courseSections")),
			active: localStorage.getItem("active")
		};
	} catch (exception) {
		return {};
	}
}
