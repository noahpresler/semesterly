from scripts.textbooks.bn_textbook_parser import BNParser

class VandyTextbookParser(BNParser):
    def __init__(self,**kwargs):
        super(VandyTextbookParser, self).__init__(
			"65163",
			"vanderbilt.bncollege.com",
			"vandy",
			"-",
            **kwargs)
