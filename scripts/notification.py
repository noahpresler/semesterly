import os

import argparse

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import Semester
from mailers.courses_posted_mailer import CoursesPostedMailer
from mailers.textbook_mailer import TextbookMailer

def get_args():
    parser = argparse.ArgumentParser(description='Notification sender for Semester.ly')
    parser.add_argument('--type', dest='type', required=True, choices=["email", "chrome"])
    parser.add_argument('--action', dest='action', required=True,
                        choices=["courses_posted", "textbooks"])
    parser.add_argument('--school', dest='school', required=True, help="School is required")
    parser.add_argument('--term', dest='term', required=True,
                        help="Term (e.g. Fall, Spring) is required")
    parser.add_argument('--year', dest='year', required=True, help="Year is required")
    parser.add_argument('--test_students', dest='test_students', default=[], nargs='+', type=int,
                        help='Send a notification to students with these ids only')
    return parser.parse_args()

def send_email(action, school, semester, test_students):
    mailer = None

    if action == "courses_posted":
        mailer = CoursesPostedMailer(school, semester, test_students)
    elif action == "textbooks":
        mailer = TextbookMailer(school, semester, test_students)
    mailer.send_emails()

def send_chrome_notif(action, school, semester, test_students):
    pass

def main():
    args = get_args()
    semester = Semester.objects.filter(name=args.term, year=args.year)

    if args.type == "email":
        send_email(args.action, args.school, semester, args.test_students)
    elif args.type == "chrome":
        send_chrome_notif(args.action, args.school, semester, args.test_students)

if __name__ == "__main__":
    main()
