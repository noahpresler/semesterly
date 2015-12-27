# [Semesterly](http://semester.ly)
A dynamic timetable generator for students.
Find the perfect schedule based on your preferences and
the courses you choose.

##Contribute

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
Coming soon.
