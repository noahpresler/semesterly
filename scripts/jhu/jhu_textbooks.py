from scripts.textbooks.bn_textbook_parser import *

class JHUTextbookParser(BNParser):
    def __init__(self, term="Spring", year=2017,**kwargs):
        super(JHUTextbookParser, self).__init__(
            "18053",
            "johns-hopkins.bncollege.com",
            "jhu",
            ".",
            term,
            year,
            **kwargs)

if __name__ == "__main__":
    raise NotImplementedError('run parsers with manage.py')