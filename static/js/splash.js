// splash page javascript here
$(document).ready(function() {  
    sizeitup();

    $('#schools-dropdown').click(function(){
        console.log('toggling');
        $('#schools-dropdown').toggleClass('open');
    });

    $('#schools-dropdown').click(function(e){
        console.log('preventing');
        e.stopPropagation();
    });

    $(document).click(function(){
        console.log('removing');
        $('#schools-dropdown').removeClass('open');
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
        $('header').removeClass('down');
    } else {
        $('header').addClass('down');
    }
});

//SMOOTH SCROLLING
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
