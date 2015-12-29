var Root = require('./root');
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
                    end_time: '16:00'
                },
                {
                    day: 'W',
                    start_time: '10:00',
                    end_time: '12:15'
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
                    end_time: '15:20'
                },
                {
                    day: 'F',
                    start_time: '9:45',
                    end_time: '10:45'
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
                end_time: '15:00'
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
                end_time: '18:30'
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
                end_time: '17:00'
            },
            {
                day: 'M',
                start_time: '10:30',
                end_time: '11:50'
            },
        ],
    },    
];
ReactDOM.render(
  <Root />,
  document.getElementById('page')
);
