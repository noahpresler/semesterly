# How to add semesters to the parser (required every semester)

## Spring

In the Spring semester, you have to add the new year in addition to the semester.

1. In `parsing/schools/jhu/config.json`, add the new year to the `"active_semesters"` as a
  key, and add `"Spring"` as a value.

    ```js
    "active_semesters": {
        "2017": ["Fall", "Summer", "Spring", "Intersession"],
        "2018": ["Fall", "Spring"],
        "2019": ["Fall", "Spring"],
        "2020": ["Fall", "Spring"],
        "2021": ["Fall", "Spring"],
        "2022": ["Fall", "Spring"],
        "2023": ["Spring"]  // Added this
      }
    ```
2. In `build/run_parser.sh`, update the command to Spring.

    Before:
    ```bash
    python3 manage.py ingest jhu --term Fall --years 2022;
    python3 manage.py digest jhu;
    ```

    After:
    ```bash
    python3 manage.py ingest jhu --term Spring --years 2023;
    python3 manage.py digest jhu;
    ```

3. In `parsing/schools/jhu/courses.py`, add the new year to the `years` variable.

    Before:
    ```python
    years = {"2022", "2021", "2020", ...}
    terms = {"Spring", "Fall", "Summer", "Intersession"}
    ```

    After:
    ```python
    years = {"2023", "2022", "2021", ...}
    terms = {"Spring", "Fall", "Summer", "Intersession"}
    ```

## Fall

In the Fall semester, you only have to update the new semester.

1. In `parsing/schools/jhu/config.json`, add the new semester the value for the current
   year.

    ```js
    "active_semesters": {
        "2017": ["Fall", "Summer", "Spring", "Intersession"],
        "2018": ["Fall", "Spring"],
        "2019": ["Fall", "Spring"],
        "2020": ["Fall", "Spring"],
        "2021": ["Fall", "Spring"],
        "2022": ["Fall", "Spring"],
        "2023": ["Fall", /* <- Added this */ "Spring"]
      }
    ```

2. In `build/run_parser.sh`, update the command to Fall.

    Before:
    ```bash
    python3 manage.py ingest jhu --term Spring --years 2023;
    python3 manage.py digest jhu;
    ```

    After:
    ```bash
    python3 manage.py ingest jhu --term Fall --years 2023;
    python3 manage.py digest jhu;