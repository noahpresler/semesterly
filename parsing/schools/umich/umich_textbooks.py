from parsing.common.textbooks.bn_textbook_parser import BNParser


class UmichTextbookParser(BNParser):
    """Textbook parser for University of Michigan."""

    def __init__(self, term="Fall", year=2017, **kwargs):
        super(UmichTextbookParser, self).__init__(
            "28052",  # storeid
            "umichigan.bncollege.com",
            "umich",
            "-",
            term,
            year,
            **kwargs)
