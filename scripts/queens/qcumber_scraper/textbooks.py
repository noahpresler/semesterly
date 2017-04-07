import requests
import re
import sys
import logging
from writer import write_textbook
from bs4 import BeautifulSoup

class TextbookScraper(object):

    def __init__(self, config):
        self.config = config

    def num_available(self, s):
        if s:
            m = re.search(r"\((\d+)", s)
            return int(m.group(1)) if m else 0
        else:
            return 0

    def price(self, s):
        if s:
            m = re.search(r"(\$\d+\.\d{2})", s)
            return m.group(1) if m else None
        else:
            return None

    def scrape(self, save_to_db=False):

        logging.info("Starting textbook scrape")

        logging.info("Getting a list of courses")
        r = requests.get("http://www.campusbookstore.com/Textbooks/Booklists/")

        logging.info("Got list...")

        b = BeautifulSoup(r.text)
        content = b.find("div", {"class":"thecontent"})
        links  = content.find_all("a")

        temp = []

        for link in links:
            if "campusbookstore.com/Textbooks/Course/" in link.attrs.get("href", ""):
                m = re.search("^(\D+)(\d+).*$", link.string)
                # Only parse letters in config
                if m and m.group(1)[1].upper() in self.config['letters']:
                    temp.append((m.group(1), m.group(2), link.attrs["href"]))

        logging.info("Parsing courses")
        for subject, course, link in temp:

            # logging.info('Book for {} {}'.format(subject, course))

            response = requests.get(link)
            b = BeautifulSoup(response.text)

            # Looking at the page source, 49 books seems to be the limit (numbers padded the 2 digits)
            for i in range (0, 99, 2):

                book_id = "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_ModeFull".format(i)

                book = b.find("div", {"id": book_id})
                if not book:
                    break

                temp = book.find("table").find("table").find_all("td")[1]

                textbook_attrs = {"listing_url": link + "#" + book_id}

                # Title
                title = temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_BookTitle".format(i)}).string
                textbook_attrs["title"] = title

                # Authors
                authors = temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_BookAuthor".format(i)}).string
                if authors and authors[:4] == " by ":
                    textbook_attrs["authors"] = authors[4:]

                # Required
                required = temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_StatusLabel".format(i)}).string
                if required and "REQUIRED" in required.upper():
                    textbook_attrs["required"] = True

                # ISBN 13
                isbn_13 = temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_ISBN13Label".format(i)}).string
                if isbn_13 and "[N/A]" in isbn_13:
                    textbook_attrs["isbn_13"] = None
                else:
                    textbook_attrs["isbn_13"] = isbn_13

                # ISBN 10
                isbn_10 = temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_ISBN10Label".format(i)}).string
                if isbn_10 and "[N/A]" in isbn_10:
                    textbook_attrs["isbn_10"] = None
                else:
                    textbook_attrs["isbn_10"] = isbn_10

                # New data
                new_price = self.price(temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_NewPriceLabel".format(i)}).string)
                new_available = self.num_available(temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_NewAvailabilityLabel".format(i)}).string)
                if new_price:
                    textbook_attrs["new_price"] = new_price
                if new_available:
                    textbook_attrs["new_available"] = new_available

                # Used data
                used_price = self.price(temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_UsedPriceLabel".format(i)}).string)
                used_available = self.num_available(temp.find("span", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_UsedAvailabilityLabel".format(i)}).string)
                if used_price:
                    textbook_attrs["used_price"] = used_price
                if used_available:
                    textbook_attrs["used_available"] = used_available

                # Classifieds info
                classified_info = temp.find("a", {"id": "ctl00_ContentBody_ctl00_CourseBooksRepeater_ctl{:02d}_test_ClassifiedsLabel".format(i)}).string
                if classified_info:
                    textbook_attrs["classified_info"] = classified_info

                # Add the textbook
                if textbook_attrs["isbn_10"] or textbook_attrs["isbn_13"]:

                    if not save_to_db: # export as JSON instead
                        write_textbook(subject, course, textbook_attrs)
                    else:
                        yield textbook_attrs
                    # try:
                        # logging.info("----Parsed book: {title} by {authors} ({isbn_13})".format(**textbook_attrs))
                    # except:
                        # logging.info("----Parsed book.")


def main(save_to_db):
    root_logger = logging.getLogger()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(asctime)s][%(levelname)s][%(processName)s]: %(message)s"))

    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    logging.getLogger("requests").setLevel(logging.WARNING)

    config = dict(
        letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    )
    scraper = TextbookScraper(config)
    if save_to_db:
        for tb in scraper.scrape(save_to_db):
            yield tb
    else:
        scraper.scrape(save_to_db)


if __name__ == '__main__':
    main(False)
