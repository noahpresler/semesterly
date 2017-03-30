from scripts.textbooks.bn_textbook_parser import *

class UMDTextbookParser(BNParser):
    def __init__(self, term="Fall", year=2017,**kwargs):
        super(UMDTextbookParser, self).__init__(
            "15551",
            "umcp.bncollege.com",
            "umd",
            "",
            term,
            year,
            **kwargs)

if __name__ == "__main__":
    raise NotImplementedError('run parsers with manage.py')