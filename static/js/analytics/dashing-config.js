REFRESH_INTERVAL = 3000

var dashboard = new Dashboard();

dashboard.addWidget('numberTimetablesWidget', 'Timetables', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_timetables_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberCalendarExportsWidget', 'List', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_calendar_exports_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberFinalExamViewsWidget', 'Number', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_final_exam_views_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberSignupsWidget', 'Number', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_signups_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberFacebookAlertsViewsWidget', 'Number', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_facebook_alerts_views_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});

dashboard.addWidget('numberFacebookAlertsClicksWidget', 'Number', {
    getData: function () {
        var self = this;
        Dashing.utils.get('number_facebook_alerts_clicks_widget', function(data) {
            console.log(data)
            $.extend(self.scope, data);
        });
    },
    interval: REFRESH_INTERVAL
});
