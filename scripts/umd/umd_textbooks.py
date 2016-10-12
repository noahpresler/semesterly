from scripts.base_bn_textbook_parser import *

if __name__ == "__main__":
	textbook_parser = TextbookParser(
	    "15551",
	    "umcp.bncollege.com",
	    "umd",
	    ""
	)

	textbook_parser.parse()