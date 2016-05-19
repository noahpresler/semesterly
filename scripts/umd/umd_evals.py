import sys
import requests, cookielib
from bs4 import BeautifulSoup
import re
import datetime
import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()

django.setup()

class Professor:
    def __init__(self, name, rank, average_rating, num_reviews):
        self.name = name
        self.rank = rank
        self.average_rating = average_rating
        self.num_reviews = num_reviews
        self.reviews = []

    def __str__(self):
        ret = (
            "Name: " + self.name + ", average rating: " + self.average_rating
            + ", number of reviews: " + self.num_reviews + "reviews:\n"
        )

        for review in self.reviews:
            ret += str(review)

        ret += "\n"

        return ret


class Review:
    def __init__(self, reviewer, rating, course, year, text, professor):
        self.reviewer = reviewer
        self.rating = rating
        self.course = course
        self.year = year
        self.text = text
        self.professor = professor

        course_objs = UmdCourse.objects.filter(code__contains=course)
        if course_objs:
            obj, created = UmdCourseEvaluation.objects.get_or_create(
                course=course_objs[0],
                score=rating,
                summary=text,
                course_code=course,
                professor=professor,
                year=year)
            if created:
                print "Evaluation Object CREATED for: " + course
            else:
                print "Evaluation Object FOUND for: " + course

    def __str__(self):
        return (
            "reviewer: " + self.reviewer + ", rating: " + str(self.rating) + ", course: "
            + self.course + ", year: " + self.year + "\ntext: " + self.text + "\n"
        )


class umdReview:

    def __init__(self):
        self.s = requests.Session()
        self.cookies = cookielib.CookieJar()
        self.headers = {
            'User-Agent': 'My User Agent 1.0'
        }
        self.base_url = "http://www.ourumd.com/"
        self.professors = []

    def get_html(self, url):
        html = None
        while html is None:
            try:
                r = self.s.get(url,cookies=self.cookies,headers=self.headers)
                if r.status_code == 200:
                    html = r.text
            except (requests.exceptions.Timeout,
                    requests.exceptions.ConnectionError):
                continue
        return html.encode('utf-8')

    def get_reviews(self, url, name):
        html = self.get_html(self.base_url + url)
        soup = BeautifulSoup(html,"html.parser")
        content = soup.find("div", {"id": "body"})
        table = content.find("table")
        for row in table.findAll("tr"):
            review = []
            for td in row.findAll("td"):
                if td != None:
                    review.append(td.contents)

            left_col = review[0]
            right_col = review[1]

            if str(left_col[0].contents[0]) == "Anonymous":
                reviewer = left_col[0].contents[0]
            else:
                reviewer = left_col[0].contents[0].contents[0]

            rating = left_col[2]["src"][len(left_col[2]["src"]) - 1]

            course_string = left_col[4].split()
            if len(course_string) > 1:
                course = course_string[1]
            else:
                course = ""

            if len(left_col) < 9:
                date_string = ""
            else:
                date_string = left_col[8]

            try:
                date = datetime.datetime.strptime(date_string, "%B %d, %Y, %I:%M %p")
                m = date.month
                y = date.year

                # VERY ROUGH ESTIMATE!
                if m <= 7:
                    semester = "Spring"
                else:
                    semester = "Fall"

                year = str(semester) + ":" + str(y)

            except ValueError:
                year = ""

            text = ""

            for paragraph in right_col:
                text += str(paragraph.encode('utf-8').decode('ascii', 'ignore'))

            text = text.replace("<br/>", "")
            if course:
                Review(reviewer, rating, course, year, text, name)

    def get_professors(self, url):
        html = self.get_html(self.base_url + url)
        soup = BeautifulSoup(html,"html.parser")
        content = soup.find("div", {"id": "body"})
        table = content.find("table")
        for row in table.findAll("tr"):
            prof = []
            if row.find("th") != None:
                continue
            for td in row.findAll("td"):
                if td != None:
                    prof.append(td.contents[0])

            rank = prof[0][:-1]

            name = re.sub(' +',' ',prof[1].contents[0])

            review_url = prof[1].get("href")

            rating = prof[2]

            num_reviews = prof[4]

            self.get_reviews(review_url, name)

    def parse_reviews(self):
        url = "viewreviews/?all"
        self.get_professors(url)
        return self.professors

        # Un-comment if needed.
        # for professor in self.professors:
        #     print(professor)


if __name__ == "__main__":
    u = umdReview()
    profs = u.parse_reviews()