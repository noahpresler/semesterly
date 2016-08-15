document.addEventListener("DOMContentLoaded", function(event) { 

	// ssection enrolment
	var sections = document.getElementsByClassName('section');
	for (var i = 0; i < sections.length; ++i) {
		var s = sections[i];
		var waitlist = s.getAttribute('data-waitlist');
		var size = s.getAttribute('data-size');
		var enrolled = s.getAttribute('data-enrolment');
		var left = size - enrolled;
		var h = s.getElementsByClassName('enrollment')[0];
		if (size < 0) {
			s.className += '';
			var txt = 'No enrollment info';
		} else if (waitlist > 0) {
			s.className += ' red';
			var txt = '<span>' + waitlist + ' waitlist</span> / ' + size + ' seats';
		} else if (left == 0) {
			s.className += ' red';
			var txt = '<span>' + left + ' open</span> / ' + size + ' seats';
		} else if (left < size / 10) {
			s.className += ' yellow';
			var txt = '<span>' + left + ' open</span> / ' + size + ' seats';
		} else {
			s.className += ' green';
			var txt = '<span>' + left + ' open</span> / ' + size + ' seats';
		}
		h.innerHTML = txt;
	}

	// Course ratings
	var ratings = document.getElementsByClassName('rating-wrapper');
	for (var i = 0; i < ratings.length; ++i) {
		var r = ratings[i];
		var score = r.getAttribute('data-score');
		var percent = ((score / 5) * 100).toString() + "%";
		var h = r.getElementsByClassName('rating')[0];
		h.style.width = percent;
	}

});