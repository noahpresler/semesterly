# Documentation Quiz

Please visit the [docs](https://semesterly-v2.readthedocs.io/en/latest/index.html) and
answer the following questions.

1. What is the command I run to get the courses from Fall 2021?
python manage.py ingest jhu --years 2021 --terms Fall

1. How do I then load those courses into my database?
python manage.py digest jhu

1. How do I get a terminal running in my docker container?
Right-click a container and select "Attach Shell"

1. Where do I store data such as passwords or secrets that I don’t want to commit?
sensitive.py or dev_credentials.py

1. What branch do I create a new branch off of when developing?
develop

1. If I want to start on a feature called myfeature, what should the branch name be?
feature/myfeature

1. What is the preferred format for commit messages?
Topic: Message

1. What linters do we run against our code?
ESLint styling
Prettier
PascalCase
camelCase

1. What is a FeatureFlowView?
It is used to handle a request when a user loads the home timetable page.
The initial data for the frontend is stored inside of the view and passed
as a json string in the response.


When you are done answering the questions, create a PR for a discussion of your answers.