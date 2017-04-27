/* global Dashboard */

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

// dashboard.addWidget('signupsPerDayWidget', 'SignupsPerDay', {
//   getData() {
//     const self = this;
//     Dashing.utils.get('signups_per_day_widget', (data) => {
//       // console.log(data);
//       $.extend(self.scope, data);
//     });
//   },
//   interval: DAY_INTERVAL,
// });

dashboard.addWidget('signupsPerDayWidget', 'CustomGraph', {
  color: 'steelblue',
  scope: {
    xFormat(n) {
      if (Number.isInteger(n)) {
        const today = new Date();
        const date = new Date(today);
        date.setDate(today.getDate() + n);
        return date.toISOString().slice(5, 10);
      }
      return '';
    },
    yFormat(n) {
      return n.toString();
    },
  },
  properties: {
    renderer: 'line',
    padding: {
      top: 0.1,
      right: 0.1,
    },
  },
  getData() {
    const self = this;
    Dashing.utils.get('signups_per_day_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('reactionsWidget', 'CustomGraph', {
  color: 'pink',
  scope: {
    xFormat(n) {
      switch (n) {
        case 0: return 'CRAP';
        case 1: return 'FIRE';
        case 2: return 'BORING';
        case 3: return 'HARD';
        case 4: return 'OKAY';
        case 5: return 'EASY';
        case 6: return 'INTERESTING';
        case 7: return 'LOVE';
        default:
          console.log('error');
          return '';
      }
    },
    properties: {
      renderer: 'bar',
      padding: {
        top: 0.1,
        right: 0.1,
      },
    },
  },
  getData() {
    const self = this;
    Dashing.utils.get('reactions_widget', (data) => {
      // console.log(data);
      $.extend(self.scope, data);
    });
  },
  interval: 60000,
});
