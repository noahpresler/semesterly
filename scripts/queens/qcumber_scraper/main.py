#!/usr/bin/env python
import os
import sys
import logging
from multiprocessing import Process, Queue
try:
    from queue import Empty
except ImportError:
    # Python 2.x
    from Queue import Empty

from navigation import SolusSession
from scraper import SolusScraper


class ScrapeJob(dict):
    """
    Holds data on a scraper job. Includes default arguments.
    """

    def __init__(self, *args, **kwargs):
        dict.__init__(self, *args, **kwargs)

        # Supply custom defaults
        self["deep"] = self.get("deep", True)
        self["letters"] = self.get("letters", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        self["subject_start"] = self.get("subject_start", 0)
        self["subject_step"] = self.get("subject_step", 1)
        self["subject_end"] = self.get("subject_end", None)
        self["course_start"] = self.get("course_start", 0)
        self["course_end"] = self.get("course_end", None)


class JobManager(object):
    """Handles dividing up the scraping work and starting the scraper threads"""

    def __init__(self, user, passwd, save_to_db, config):
        """Divide the work up into ScrapeJobs"""

        self.user = user
        self.passwd = passwd
        self.config = config
        self.save = save_to_db
        self.jobs = Queue()
        self.semesters = config.get('semesters', None)

        # Enforce a range of 1 - 10 threads with a default of 5
        self.config["threads"] = max(min(self.config.get("threads", 5), 10), 1)
        self.config["job"] = self.config.get("job", ScrapeJob())

        # Divide up the work for the number of threads
        self.make_jobs()

    def start(self):
        """Start running the scraping threads"""

        self.start_jobs()

    def make_jobs(self):
        """Takes the configuration and returns a list of jobs"""

        job = self.config["job"]
        letters = job["letters"]
        threads_per_letter = max(self.config.get("threads_per_letter", int((self.config["threads"] - 1)/len(letters) + 1)), 1)

        for l in letters:
            job_letter = ScrapeJob(job)
            job_letter["letters"] = l
            for s in range(0, threads_per_letter):
                temp = ScrapeJob(job_letter)
                temp["subject_start"] = job["subject_start"] + s
                temp["subject_step"] = threads_per_letter
                logging.info(u"Made job: {0}".format(temp))
                self.jobs.put_nowait(temp)

    def run_jobs(self, queue):
        """Initialize a SOLUS session and run the jobs"""

        # Initialize the session
        try:
            session = SolusSession(self.user, self.passwd)
        except EnvironmentError as e:
            logging.critical(e)
            # Can't log in, therefore can't do any jobs
            # As long as at least 1 of the threads can log in,
            # the scraper will still work
            return

        # Run all the jobs in the job queue
        while True:
            try:
                job = queue.get_nowait()
            except Empty as e:
                return

            # Run the job
            if PROFILE:
                import cProfile
                cProfile.runctx("SolusScraper(session, job, self.db).start()", globals(), locals())
            else:
                SolusScraper(session, job, self.db).start()
                

    def start_jobs(self):
        """Start the threads that perform the jobs"""

        threads = []
        for x in range(self.config["threads"]):
            threads.append(Process(target=self.run_jobs, args=(self.jobs,)))
            threads[-1].start()

        for t in threads:
            t.join()

    def parse_courses(self):
        """Course object generator matching interface for BaseParser."""
        # Setup the logger before any logging happens
        _init_logging()

        try:
            session = SolusSession(self.user, self.passwd)
        except EnvironmentError as e:
            logging.critical(e)
            # Can't log in, therefore can't do any jobs
            # As long as at least 1 of the threads can log in,
            # the scraper will still work
            return

        for course in SolusScraper(session, ScrapeJob(), True, self.semesters).start():
            yield course


def _init_logging():

    root_logger = logging.getLogger()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(asctime)s][%(levelname)s][%(processName)s]: %(message)s"))
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    logging.getLogger("requests").setLevel(logging.WARNING)

if __name__ == "__main__":

    # Setup the logger before any logging happens
    _init_logging()

    # Get credientials
    try:
        from queens_config import USER, PASS, PROFILE, SAVE_TO_DB
    except ImportError:
        logging.critical("No credientials found. Create a queens_config.py file with USER, PASS, and PROFILE constants")

    config = dict(
        name = "Shallow scrape with threading",
        description = "Scrapes the entire catalog using multiple threads",
        threads = 5,
        job = ScrapeJob(letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ", deep=False),
        threads_per_letter = 1,
    )

    # Start scraping
    JobManager(USER, PASS, SAVE_TO_DB, config).start()
