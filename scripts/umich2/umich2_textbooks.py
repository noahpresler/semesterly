from scripts.base_bn_textbook_parser import *

if __name__ == "__main__":
	textbook_parser = TextbookParser(
	    "28052", # storeid
	    "umichigan.bncollege.com",
	    "umich2",
	    "-"
	)

	textbook_parser.parse()