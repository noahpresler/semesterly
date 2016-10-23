from scripts.base_bn_textbook_parser import *

def main():
	textbook_parser = TextbookParser(
	    "18555",
	    "psu.bncollege.com",
	    "pennstate",
	    "-"
	)
	textbook_parser.parse()

if __name__ == "__main__":
	main()