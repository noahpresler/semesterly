/* global Chart, Dashboard */
/* eslint no-unused-vars: ['error', { 'varsIgnorePattern': 'chart' }]*/

// const REAL_TIME_INTERVAL = 3000;
// const MINUTE_INTERVAL = 60000;
const HOUR_INTERVAL = 360000;
const DAY_INTERVAL = 8640000;

const primaryColors = [
  '#FD7473', '#5CCCF2', '#36DEBB', '#FFD462', '#C585DE', '#53e997',
  '#D4DBC8', '#E7F76D', '#A3F5F2', '#7499A2', '#C8F7C5', '#4c7fd8',
];
const secondaryColors = [
  '#e36867', '#52b7d9', '#30c7a8', '#e5be58', '#b177c7', '#4ad187',
  '#B5BFA3', '#C9E20A', '#7CD2CF', '#668B94', '#C4D44D', '#6598f1',
];

Chart.defaults.global.responsive = true;
Chart.defaults.global.legend.position = 'bottom';

const dashboard = new Dashboard();

dashboard.addWidget('numberTimetablesWidget', 'Timetables', {
  getData() {
    const self = this;
    Dashing.utils.get('number_timetables_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('calendarExportsWidget', 'List', {
  getData() {
    const self = this;
    Dashing.utils.get('calendar_exports_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('finalExamViewsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('final_exam_views_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('totalSignupsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('total_signups_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('facebookAlertsViewsWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('facebook_alerts_views_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('facebookAlertsClicksWidget', 'Number', {
  getData() {
    const self = this;
    Dashing.utils.get('facebook_alerts_clicks_widget', (data) => {
      $.extend(self.scope, data);
    });
  },
  interval: HOUR_INTERVAL,
});

dashboard.addWidget('signupsPerDayWidget', 'SignupsPerDay', {
  getData() {
    const self = this;
    Dashing.utils.get('signups_per_day_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-signups-per-day');
        const chart = new Chart(ctx, {
          type: 'line',                                 // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                label: 'Number of Signups',
                fill: false,
                lineTension: 0.1,
                backgroundColor: primaryColors[0],
                borderColor: secondaryColors[0],
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBorderColor: 'rgba(220,220,220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: data.data.values,
              },
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('reactionsWidget', 'Reactions', {
  getData() {
    const self = this;
    Dashing.utils.get('reactions_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-reactions');
        const chart = new Chart(ctx, {
          type: 'bar',                                  // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                label: 'Number of Users',
                backgroundColor: 'rgba(255,23,68,0.2)',
                borderColor: 'rgba(255,23,68,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,23,68,0.4)',
                hoverBorderColor: 'rgba(255,23,68,1)',
                data: data.data.values,
              },
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('usersBySchoolWidget', 'UsersBySchool', {
  getData() {
    const self = this;
    Dashing.utils.get('users_by_school_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-users-by-school');
        const chart = new Chart(ctx, {
          type: 'pie',                                  // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                data: data.data.values,                 // The data labels and
                backgroundColor: primaryColors,         // values are passed in
                hoverBackgroundColor: secondaryColors,  // through our call to
              },                                        // the Python widget.
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('usersByClassYearWidget', 'UsersByClassYear', {
  getData() {
    const self = this;
    Dashing.utils.get('users_by_class_year_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-users-by-class-year');
        const chart = new Chart(ctx, {
          type: 'pie',                                  // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                data: data.data.values,                 // The data labels and
                backgroundColor: primaryColors,         // values are passed in
                hoverBackgroundColor: secondaryColors,  // through our call to
              },                                        // the Python widget.
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('timetablesBySchoolWidget', 'TimetablesBySchool', {
  getData() {
    const self = this;
    Dashing.utils.get('timetables_by_school_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-timetables-by-school');
        const chart = new Chart(ctx, {
          type: 'pie',                                  // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                data: data.data.values,                 // The data labels and
                backgroundColor: primaryColors,         // values are passed in
                hoverBackgroundColor: secondaryColors,  // through our call to
              },                                        // the Python widget.
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});

dashboard.addWidget('timetablesBySemesterWidget', 'TimetablesBySemester', {
  getData() {
    const self = this;
    Dashing.utils.get('timetables_by_semester_widget', (data) => {
      $.extend(self.scope, data);
      $(document).ready(() => {
        const ctx = document.getElementById('chart-timetables-by-semester');
        const chart = new Chart(ctx, {
          type: 'pie',                                  // Here, we render a
          data: {                                       // chart on the element
            labels: data.data.labels,                   // that has the
            datasets: [                                 // corresponding ID.
              {
                data: data.data.values,                 // The data labels and
                backgroundColor: primaryColors,         // values are passed in
                hoverBackgroundColor: secondaryColors,  // through our call to
              },                                        // the Python widget.
            ],
          },
        });
      });
    });
  },
  interval: DAY_INTERVAL,
});
