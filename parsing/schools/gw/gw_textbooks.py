"""Gw textbook parser."""

from parsing.common.textbooks.bkstr_dot_com import BkstrDotComParser


class GWTextbookParser(BkstrDotComParser):
    """GW textbook parser.

    Inherits for bkstr.com parser.
    """

    def __init__(self, **kwargs):
        """Create instance of textbook parser.

        Args:
            **kwargs: pass-through
        """
        store_id = '10370'
        super(GWTextbookParser, self).__init__('gw', store_id, **kwargs)
