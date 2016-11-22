def time_12to24(time12):
    ''' Attempts to convert 12hr time to 24hr time

    Args:
        time12 (str): 12 hour time format

    Returns:
        str: 24 hr time in format hrhr:minmin
    '''
    # Regex extract
    match = re.match("(\d*):(\d*)(.)", time12)

    # Transform to 24 hours
    hours = int(match.group(1))
    if re.search(r'[pP]', match.group(3)):
        hours = (hours%12)+12

    # Return as 24hr-time string
    return str(hours) + ":" + match.group(2)

def extract_info(course, text):
    ''' Attempts to extract info from text and put it into course object.

    Args:
        course (dict): course object to place extracted information into
        text (str): text to attempt to extract information from

    Returns:
        * modifies course object
        str: the text trimmed of extracted information
    '''
    text = text.encode('utf-8', 'ignore')

    extractions = {
        'prereqs' : r'[Pp]r(?:-?)e[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
        'coreqs'  : r'[Cc]o(?:-?)[rR]eq(?:uisite)?(?:s?)[:,\s]\s*(.*?)(?:\.|$)\s*',
        'geneds' : r'(GE .*)'
    }

    for ex in extractions:
        rex = re.compile(extractions[ex])
        extracted = rex.search(text)
        if extracted:
            if len(course[ex]) > 0:
                course[ex] += ', '
            course[ex] += extracted.group(1) # okay b/c of course_cleanup
        text = rex.sub('', text).strip()

    return text
