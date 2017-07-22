# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

from final_exam_scheduler import FinalExamScheduler, Rule


class JHUFinalExamScheduler(FinalExamScheduler):
    """
    Database Object that has a list of JHU's rules for the current semester.
    Should be updated every semester. Initialize each Rule with select fields
    depening on what determines whether the Rule is valid for. See Final Exam Scheduler
    for more information
    """

    def __init__(self):
        # FALL 2016
        # rule1 = Rule(['M'],'8:00','12/20 2-5',start_only = True)
        # rule2 = Rule(['M'],'9:00','12/21 2-5',start_only = True)
        # rule3 = Rule(['M'],'10:00','12/16 2-5',start_only = True)
        # rule4 = Rule(['M'], '11:00','12/14 9-12', start_only = True)
        # rule5 = Rule(['M'], '12:00','12/17 2-5',start_only = True)
        # rule6 = Rule(['M'], '13:30','12/19 9-12', start_only = True)
        # rule7 = Rule(['M'], '15:00','12/15 9-12', start_only = True)
        # rule8 = Rule(['M'], '16:30','12/14 2-5',start_only = True)
        # rule9 = Rule(['M'], '18:00','12/19 6-9',start_only = True)
        # rule10 = Rule(['W'], '18:00','12/14 6-9',start_only = True)
        # rule11 = Rule(['T'], '9:00','12/16 9-12', start_only = True)
        # rule12 = Rule(['T'], '10:30','12/20 9-12', start_only = True)
        # rule13 = Rule(['T'], '12:00','12/15 2-5',start_only = True)
        # rule14 = Rule(['T'], '13:30','12/22 9-12', start_only = True)
        # rule15 = Rule(['T'], '15:00','12/21 9-12', start_only = True)
        # rule16 = Rule(['T'], '16:30','12/19 2-5',start_only = True)
        # rule17 = Rule(['T'], '18:00','12/20 6-9',start_only = True)

        # SPRING 2017
        self.list_of_rules = [
            Rule(
                list_of_codes=['AS.110.105', 'AS.110.106', 'AS.110.107', 'AS.110.108', 'AS.110.109',
                               'AS.110.201', 'AS.110.202', 'AS.110.302'], result='5/10 9-12'),
            Rule(code_regex=r'AS\.(210|373|375|377|378|380|381|384).(1|2)..',
                 result='Exam time not found'),
            Rule(list_of_codes=['AS.171.102', 'AS.171.108'], result='5/18 9-12'),
            Rule(list_of_codes=['AS.020.152'], result='5/14 9-12'),
            Rule(list_of_codes=['EN.600.226'], result='5/14 2-5'),
            Rule(list_of_codes=['EN.600.120'], result='5/10 6-9'),
            Rule(list_of_days=['M'], start_time='8:00', result='5/18 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='9:00', result='5/17 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='10:00', result='5/16 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='11:00', result='5/15 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='12:00', result='5/12 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='13:30', result='5/11 9-12', start_only=True),
            Rule(list_of_days=['M'], start_time='15:00', result='5/13 2-5', start_only=True),
            Rule(list_of_days=['M'], start_time='16:30', result='5/16 2-5', start_only=True),
            Rule(list_of_days=['M'], start_time='18:00', result='5/15 6-9', start_only=True),
            Rule(list_of_days=['W'], start_time='18:00', result='5/17 6-9', start_only=True),
            Rule(list_of_days=['R'], start_time='18:00', result='5/11 6-9', start_only=True),
            Rule(list_of_days=['T'], start_time='9:00', result='5/12 2-5', start_only=True),
            Rule(list_of_days=['T'], start_time='10:30', result='5/13 9-12', start_only=True),
            Rule(list_of_days=['T'], start_time='12:00', result='5/17 2-5', start_only=True),
            Rule(list_of_days=['T'], start_time='13:30', result='5/18 2-5', start_only=True),
            Rule(list_of_days=['T'], start_time='15:00', result='5/11 2-5', start_only=True),
            Rule(list_of_days=['T'], start_time='16:30', result='5/15 2-5', start_only=True),
            Rule(list_of_days=['T'], start_time='18:00', result='5/16 6-9', start_only=True)
        ]
        self.schedule = {}
