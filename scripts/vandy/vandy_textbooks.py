from scripts.textbooks.bn_textbook_parser import BNParser

class VandyTextbookParser(BNParser):
    def __init__(self, term="Fall", year=2017,**kwargs):
        super(JHUTextbookParser, self).__init__(
			"65163",
			"vanderbilt.bncollege.com",
			"vandy",
            **kwargs)
