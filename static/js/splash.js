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

/* eslint-disable no-use-before-define */

// splash page javascript here
$(document).ready(() => {
  sizeitup();

  $("#schools-dropdown .mobile-nav-label").click(() => {
    $("#schools-dropdown").toggleClass("open");
  });

  $("#schools-dropdown").click((e) => {
    e.stopPropagation();
  });

  $(document).click(() => {
    $("#schools-dropdown").removeClass("open");
  });
});

$(window).resize(() => {
  sizeitup();
});

function sizeitup() {
}

$(window).scroll(() => {
  const pos = $(window).scrollTop();
  if (pos > 0) {
    $("header").removeClass("down");
  } else {
    $("header").addClass("down");
  }
});

// SMOOTH SCROLLING
/*
$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top - 70
                }, 500);
                return false;
            }
        }
    });
});
*/
