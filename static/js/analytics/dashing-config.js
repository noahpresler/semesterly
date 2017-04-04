REFRESH_INTERVAL = 3000

var dashboard = new Dashboard();

dashboard.addWidget('numberTimetablesWidget', 'List', {
    getData: function () {
        var self = this;
        Dashing.utils.get('nt_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberCalendarExportsWidget', 'List', {
    getData: function () {
        var self = this;
        Dashing.utils.get('nce_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});
