# [Semesterly](http://semester.ly)
A dynamic timetable generator for students.
Find the perfect schedule based on your preferences and
the courses you choose.

## Getting Started

To get started, simply run
```sh
$ npm install 
```
in the root directory of the project (where `package.json`) is located. This can take a few minutes to complete.

Finally, add a "local_settings.py" into the inner `semesterly/` directory, and update your database settings.

### Run
To run the server, execute the command
```sh
$ python manage.py runserver 
```
Your local version of Semesterly will be available at [127.0.0.1:8000](http://127.0.0.1:8000/).

### Gulp
[Gulp](http://gulpjs.com/) will combine all our JSX files into one JavaScript file (`application.js`). Keep a terminal
tab or window open and run 
```sh
$ gulp
```
Gulp will wait for changes in the JSX files, and update `application.js` accordingly. If you find that
it has stopped transforming, restart the process.

### Further Instructions
Coming soon!!


## Contributing:
For details on how to contribute to semesterly, have a look at our wiki.# Want to contribute?
This document details our overall methodology for how to contribute to semesterly, and should be read through before pushing any code. All of the systems we have in place are to ensure developer efficiency in the long run, organize/coordinate tasks, and maintain (or improve) the quality of our codebase. If you think anything in this doc could be improved with respect to the above points, definitely suggest it - our ultimate goal is to make semesterly better, and we shouldn't be afraid of change to accomplish that goal. Here's a tl;dr of what working on something at semesterly would look like in a normal situation:

1. Pick an issue to work on, or create your own.
2. Have all discussion around the issue occur on the ticket itself so that people can refer back to it. When you're ready to write code, create a feature branch off of our development branch (staging), following git flow.
3. Write code for this task, following the relevant style guides/conventions. Write specs/tests/docs if applicable.
4. When you're ready, make a pull request against develop, referencing the issue it's addressing (if applicable).
5. Have at least one other dev do a code review, and iterate back and forth until you are both satisfied.
6. Merge into develop.

# Git workflows:
We will use a rough version of git flow as our git workflow. For more about git flow and the other workflows out there, check out https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow. Here are some of the important points:
* changes are done in feature branches, which are branched of off staging
* when we want to push new features onto prod, we make a release branch off of staging which is used to make sure everything works properly, update docs, etc. - essentially making it prod ready. This also means that any new features done after the release branch doesn't make it into the next release. The release branch is then merged into prod (i.e. master) and master is merged into staging to incorporate any updates from the release branch.
* if a bug fix is needed on prod, a hot fix branch is made directly off of master to address the issue.

There's a git-flow library out there to help you implement the workflow. Here's how to set it up: 
TODO

If you're looking for an issue to work on, check for issues with the "Help Wanted" tag, or ask around in the slack channel. Or, you can look through issues by order of priority. Here's what each priority label means:
1. P0: Absolutely urgent. Usually major bugs that should be hotfixed or super crucial features. Usually a "drop everything and work on this" type of issue
2. P1: Generally the most important issues people should be working on, outside of one off P0s
3. P2: Major/Core issues
4: P3: Would be nice to haves
5: P4: Nice idea, but no immediate intent to have anyone work on it.

# Coding style:
Here are the style conventions we follow:
* Python
    * Unless specified otherwise, follow [PEP8](https://www.python.org/dev/peps/pep-0008/)
    * **Docstrings**: we use [Google style docstrings](https://google.github.io/styleguide/pyguide.html?showone=Comments#Comments) since they are both human readable and interpretable by [Sphinx](http://www.sphinx-doc.org/en/stable/)
* Javascript - https://github.com/airbnb/javascript
* React/Redux- https://github.com/airbnb/javascript/tree/master/react
* CSS - None yet???

Unless there's an explicit reason not to, you should write tests for code you commit.
* Python/Django - doctests, or unittests. For tests touching our db, django has their own module based on unites.
* React/Redux/Frontend - TBD

In general, just please follow general best practices. If you don't know what that means, this is a good book to read: https://www.amazon.ca/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882. Commenting code is OK, but might be a sign that your code isn't clear enough.
