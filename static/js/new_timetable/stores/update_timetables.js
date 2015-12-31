var actions = require('../actions/update_timetables.js');

test_timetable = 
[ 
    {
        code: 'MAT223H1',
        lecture_section: 'L0101',
        title:'Linear Algebra Methodology',
        slots: [
                {
                    day: 'M',
                    start_time: '14:00',
                    end_time: '16:00',
                    id: 1
                },
                {
                    day: 'W',
                    start_time: '10:00',
                    end_time: '12:15',
                    id: 2
                },
            ],
    },
    {
        code: 'CSC148H1',
        lecture_section: 'L5001',
        title:'Introduction to Computer Programming',
        slots: [
                {
                    day: 'T',
                    start_time: '13:00',
                    end_time: '15:20',
                    id: 5
                },
                {
                    day: 'F',
                    start_time: '9:45',
                    end_time: '10:45',
                    id: 6
                },
            ],
    },
    {
        code: 'LIN203H1',
        lecture_section: 'L2001',
        title:'English Words',
        slots: [
            {
                day: 'R',
                start_time: '12:00',
                end_time: '15:00',
                id: 7
            },
        ],
    },      
    {
        code: 'SMC438H1',
        lecture_section: 'L0101',
        title:'Business Innovation',
        slots: [
            {
                day: 'W',
                start_time: '16:00',
                end_time: '18:30',
                id: 8
            },
        ],
    },
    {
        code: 'OPT315H1',
        lecture_section: 'L0101',
        title:'Optimizing Semesterly',
        slots: [
            {
                day: 'F',
                start_time: '15:30',
                end_time: '17:00',
                id: 9
            },
            {
                day: 'M',
                start_time: '10:30',
                end_time: '11:50',
                id: 10
            },
        ],
    },    
];

module.exports = Reflux.createStore({
  listenables: [actions],

  updateTimetables: function(new_timetables) {
    this.trigger({timetables: test_timetable});
  },

  getInitialState: function() {
    return {timetables: test_timetable};
  }
});
