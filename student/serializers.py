from django.forms import model_to_dict

from authpipe.utils import get_google_credentials
from student.utils import get_student_tts, make_token, hashids


def get_user_dict(school, student, semester):
    user_dict = {'timetables': [], 'timeAcceptedTos': None}
    if student:
        user_dict = model_to_dict(student, exclude="user id friends time_accepted_tos".split())
        user_dict["timetables"] = get_student_tts(student, school, semester)
        user_dict["userFirstName"] = student.user.first_name
        user_dict["userLastName"] = student.user.last_name

        facebook_user_exists = student.user.social_auth.filter(
            provider='facebook',
        ).exists()
        user_dict["FacebookSignedUp"] = facebook_user_exists

        google_user_exists = student.user.social_auth.filter(
            provider='google-oauth2',
        ).exists()
        user_dict["GoogleSignedUp"] = google_user_exists
        user_dict["GoogleLoggedIn"] = False
        user_dict['LoginToken'] = make_token(student).split(":", 1)[1]
        user_dict['LoginHash'] = hashids.encrypt(student.id)
        user_dict["timeAcceptedTos"] = student.time_accepted_tos.isoformat() \
            if student.time_accepted_tos else None
        if google_user_exists:
            credentials = get_google_credentials(student)
            user_dict["GoogleLoggedIn"] = not (credentials is None or credentials.invalid)

    user_dict["isLoggedIn"] = student is not None

    return user_dict