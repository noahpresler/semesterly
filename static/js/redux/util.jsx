export const randomString = (length = 30, chars="!?()*&^%$#@![]0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
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
export const saveLocalTimetable = (courseSections) => {
	if (!browserSupportsLocalStorage()) { return; }
}
