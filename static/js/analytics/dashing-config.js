/* global Dashing, Dashboard */

// const REAL_TIME_INTERVAL = 3000;
// const MINUTE_INTERVAL = 60000;
const HOUR_INTERVAL = 360000;
const DAY_INTERVAL = 8640000;

const dashboard = new Dashboard();

dashboard.addWidget('numberTimetablesWidget', 'Timetables', {
  getData() {
    const self = this;
    Dashing.utils.get('number_timetables_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('numberCalendarExportsWidget', 'List', {
  getData() {
    const self = this;
    Dashing.utils.get('number_calendar_exports_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('numberFinalExamViewsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('number_final_exam_views_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('numberSignupsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('number_signups_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('numberFacebookAlertsViewsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('number_facebook_alerts_views_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('numberFacebookAlertsClicksWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('number_facebook_alerts_clicks_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('signupsPerDayWidget', 'SignupsPerDay', {
  getData() {
    const self = this;
    Dashing.utils.get('signups_per_day_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: DAY_INTERVAL,
});
