from scripts.base_bn_textbook_parser import *

if __name__ == "__main__":
	textbook_parser = TextbookParser(
	    "18053",
	    "johns-hopkins.bncollege.com",
	    "jhu",
	    "."
	)

	textbook_parser.parse()