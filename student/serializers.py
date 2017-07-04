from rest_framework import serializers

from courses.serializers import CourseSerializer
from timetable.serializers import DisplayTimetableSerializer
from student.models import Student


def get_student_dict(school, student, semester):
    user_dict = {'timeAcceptedTos': None, 'isLoggedIn': False}
    if student is not None:
        user_dict = dict(user_dict, **StudentSerializer(student).data)
        user_dict['isLoggedIn'] = True

        timetables = student.personaltimetable_set.filter(
            school=school, semester=semester).order_by('-last_updated')
        courses = {course for timetable in timetables for course in timetable.courses.all()}
        context = {'semester': semester, 'school': school, 'student': student}
        user_dict['timetables'] = DisplayTimetableSerializer.from_model(timetables, many=True).data
        user_dict['courses'] = CourseSerializer(courses, context=context, many=True).data
    return user_dict


class StudentSerializer(serializers.ModelSerializer):
    userFirstName = serializers.CharField(source='user.first_name')
    userLastName = serializers.CharField(source='user.last_name')
    # TODO: switch to camelCase
    FacebookSignedUp = serializers.BooleanField(source='is_signed_up_through_fb')
    GoogleSignedUp = serializers.BooleanField(source='is_signed_up_through_google')
    GoogleLoggedIn = serializers.BooleanField(source='is_logged_in_google')
    LoginToken = serializers.CharField(source='get_token')
    LoginHash = serializers.CharField(source='get_hash')
    timeAcceptedTos = serializers.DateTimeField(source='time_accepted_tos', format='iso-8601')

    class Meta:
        model = Student
        fields = (
            'userFirstName',
            'userLastName',
            'FacebookSignedUp',
            'GoogleSignedUp',
            'GoogleLoggedIn',
            'LoginToken',
            'LoginHash',
            'timeAcceptedTos',
        )
