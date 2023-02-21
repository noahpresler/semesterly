# Documentation Quiz

Please visit the [docs](https://semesterly-v2.readthedocs.io/en/latest/index.html) and
answer the following questions.

1. What is the command I run to get the courses from Fall 2021?

python manage.py ingest jhu --years 2021 --terms Fall

1. How do I then load those courses into my database?

python manage.py digest jhu

1. How do I get a terminal running in my docker container?

Use VScode extension, in the Docker tab right-clicking a container, select Attach Shell

1. Where do I store data such as passwords or secrets that I don’t want to commit?

semesterly/sensitive.py

1. What branch do I create a new branch off of when developing?

develop

1. If I want to start on a feature called myfeature, what should the branch name be?

feature/myfeature

1. What is the preferred format for commit messages?

It is preferred that you follow the commit message convention of “Topic: Message”. This helps when we are browsing through commits so we can quickly identify what each commit was about. Messages should be in the imperative mood, as if you’re telling someone what to do. If it helps, you are encouraged to include the how/why - “Evaluation list: Duplicate state to avoid modifying redux state”. Furthermore, try to keep commits to “one” change at a time and commit often.

1. What linters do we run against our code?

ESLint, Prettier

1. What is a FeatureFlowView?
When a user loads the home timetable page, FeatureFlowView inside of timetable.utils is used to handle the request. On initial page load, the frontend requires some data to initialize the redux state, like information about the current user, the list of possible semesters for the school, and the list of student integrations. This initial data is created inside of the view, and passed in as a single json string in the response context.

When you are done answering the questions, create a PR for a discussion of your answers.