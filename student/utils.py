import datetime


DAY_LIST = ['M', 'T', 'W', 'R', 'F', 'S', 'U']

def next_weekday(d, weekday):
    d = d - datetime.timedelta(days=1)
    days_ahead = DAY_LIST.index(weekday) - d.weekday()
    if days_ahead <= 0:  # Target day already happened this week
        days_ahead += 7
    return d + datetime.timedelta(days_ahead)
