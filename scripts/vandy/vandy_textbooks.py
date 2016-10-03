from scripts.base_bn_textbook_parser import *

if __name__ == "__main__":
	textbook_parser = TextbookParser(
	    "65163",
	    "vanderbilt.bncollege.com",
	    "vandy",
	    "-"
	)

	textbook_parser.parse()