document.addEventListener("DOMContentLoaded", function(event) { 
	var sections = document.getElementsByClassName('section');
	for (var i = 0; i < sections.length; ++i) {
		var s = sections[i];
		var waitlist = s.getAttribute('data-waitlist');
		var size = s.getAttribute('data-size');
		var open = s.getAttribute('data-enrolment');
		var h = s.getElementsByClassName('enrollment')[0];
		if (size < 0) {
			s.className += '';
			var txt = 'No enrollment info';
		} else if (waitlist >= 0) {
			s.className += ' red';
			var txt = '<span>' + waitlist + ' waitlist</span> / ' + size + ' seats';
		} else if (open == 0) {
			s.className += ' red';
			var txt = '<span>' + open + ' open</span> / ' + size + ' seats';
		} else if (open < size / 10) {
			s.className += ' yellow';
			var txt = '<span>' + open + ' open</span> / ' + size + ' seats';
		} else {
			s.className += ' green';
			var txt = '<span>' + open + ' open</span> / ' + size + ' seats';
		}
		h.innerHTML = txt;
	}
});