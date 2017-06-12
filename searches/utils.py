import operator

from django.db.models import Q

from timetable.models import Course


def course_name_contains_token(token):
    return (Q(code__icontains=token) |
            Q(name__icontains=token.replace("&", "and")) |
            Q(name__icontains=token.replace("and", "&")))


def get_course_matches(school, query, semester):
    if query == "":
        return Course.objects.filter(school=school)

    query_tokens = query.split()
    course_name_contains_query = reduce(
        operator.and_, map(course_name_contains_token, query_tokens))
    return Course.objects.filter(
        Q(school=school) &
        course_name_contains_query &
        Q(section__semester=semester)
    ).distinct()
