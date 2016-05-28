// splash page javascript here
$(document).ready(function() {  
    sizeitup();

    $('#light-content').click(function(e){
      e.stopPropagation();
    });

    $('#light, #light-exit').click(function(){
      $('#light').addClass('out');
    });

});

$(window).resize(function() {
    sizeitup();
});

function sizeitup() {
    var bodyh = $(window).height();
}

$(window).scroll(function() {
    var bodyh = $(window).height();
    var pos = $(window).scrollTop();
    if (pos > 0) {
        $('header').addClass('up');
    } else {
        $('header').removeClass('up');
    }
});

//SMOOTH SCROLLING
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
