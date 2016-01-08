def construct_preference_tt():
    """
    Constructs a preference "timetable" based on the input preferences.
    Assumes that the inputs are always defined. A preference "timetable"
    is a list of lists consisting of predicates. Each sublist represents 
    a specific preference which is satisfied if any one of the predicates in 
    the sublist returns false. For example, in the following "tt":
    [
        [lambda co: co.time_start > 3 or co.time_end < 21], 
        [lambda co: co.day == 'M', lambda co: co.day == 'F']
    ]
    The first sublist represents the preference of starting and ending between
    10am and 6pm, and the second represents the preference of having a long 
    weekend (i.e. either no classes monday or no classes friday). 
    The reason this is similar to a timetable is because the set of all preferences are satisfied 
    if there is some combination of preferences (one from each sublist) that
    returns is False.
    """
    tt = []
    # early/late class preference
    if (NO_CLASSES_BEFORE > 0 or NO_CLASSES_AFTER < 14 * 60/get_granularity(SCHOOL)):
        tt.append([lambda co: not (get_time_index_from_string(co[0].time_start) > NO_CLASSES_BEFORE \
                            and get_time_index_from_string(co[0].time_end) < NO_CLASSES_AFTER)])

    # long weekend preference 
    if LEAST_DAYS:
        tt.append([(lambda co: co[0].day == 'T'), \
                    (lambda co: co[0].day == 'W'), \
                    (lambda co: co[0].day == 'R'), \
                    (lambda co: co[0].day == 'M'), \
                    (lambda co: co[0].day == 'F')])
    
    elif LONG_WEEKEND:
        tt.append([(lambda co: co[0].day == 'M'), \
                    (lambda co: co[0].day == 'F')])

    # break time preference
    if BREAK_TIMES:
        break_periods = [BREAK_TIMES[i:i+BREAK_LENGTH] for i in range(len(BREAK_TIMES) - BREAK_LENGTH + 1)]
        break_possibilities = [(lambda co: not (get_time_index_from_string(co[0].time_start) > periods[-1] \
                                            and get_time_index_from_string(co[0].time_end) < periods[0])) \
                                for periods in break_periods]
        tt.append(break_possibilities)

    return tt

def get_time_index_from_string(s):
    """Find the time index based on course offering string (e.g. 8:30 -> 2)"""
    return get_time_index(*get_hours_minutes(s))

def get_time_index(hours, minutes):
    """Take number of hours and minutes, and return the corresponding time slot index"""
    # earliest possible hour is 8, so we get the number of hours past 8am
    return (hours - 8) * (60 / get_granularity(SCHOOL)) + \
            minutes / get_granularity(SCHOOL)

def get_hours_minutes(time_string):
    """
    Return tuple of two integers representing the hour and the time 
    given a string representation of time.
    e.g. '14:20' -> (14, 20)
    """
    return (get_hour_from_string_time(time_string), 
        get_minute_from_string_time(time_string))

def get_hour_from_string_time(time_string):
    """Get hour as an int from time as a string."""
    return int(time_string[:time_string.index(':')]) if ':' in time_string \
                                                    else int(time_string)

def get_minute_from_string_time(time_string):
    """Get minute as an int from time as a string."""
    return int(time_string[time_string.index(':') + 1:] if ':' in time_string \
                                                        else 0)