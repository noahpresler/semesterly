# Copyright (C) 2017 Semester.ly Technologies, LLC
#
# Semester.ly is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Semester.ly is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# NOTE: module currently unused as it introduces too many bugs.
#       Might reconsider for later use.

import re
# import unicodedata

from collections import namedtuple

from parsing.library.utils import make_list

Extraction = namedtuple('Extraction', 'key container patterns')


def extract_info_from_text(text,
                           inject=None,
                           extractions=None,
                           use_lowercase=True,
                           splice_text=True):
    """Attempt to extract info from text and put it into course object.

    NOTE: Currently unstable and unused as it introduces too many bugs.
          Might reconsider for later use.

    Args:
        text (str): text to attempt to extract information from
        extractions (None, optional): Description
        inject (None, optional): Description
        use_lowercase (bool, optional): Description

    Returns:
        str: the text trimmed of extracted information
    """
    # text = text.encode('utf-8', 'ignore')
    if extractions is None:
        extractions = (
            Extraction(
                key='prereqs',
                container=make_list,
                patterns=(r'pr-?ereq(?:uisite)?s?[:,\s]\s*(.*?)(?:\.|$)\s*',
                          r'take (.*)\.?$')
            ),
            Extraction(
                key='coreqs',
                container=make_list,
                patterns=(r'co-?req(?:uisite)?s?[:,\s]\s*(.*?)(?:\.|$)\s*',)
            ),
            Extraction(
                key='geneds',
                container=make_list,
                patterns=(r'ge (.*)',)
            ),
            Extraction(
                key='fee',
                container=float,
                patterns=(
                    r'(?:lab )?fees?:?\s{1,2}?\$?\s?(\d+(?:\.\d{1,2})?)',)
            )
        )

    # Search for matches.
    extracted = inject or {}
    for key, container, patterns in extractions:
        for pattern in patterns:
            match = re.search(pattern, text.lower() if use_lowercase else text)
            if not match:
                continue
            try:
                contained = container(text[match.start() + match.group().index(match.group(1)): match.start() + match.group().index(match.group(1)) + len(match.group(1))])  # magic...
                default = extracted.setdefault(key, container())
                default += contained
                if splice_text:
                    text = text[:match.start()] + text[match.end():]
            except:
                continue
        # if isinstance(text, basestring):
        #     text = text.decode('utf-8')
        #     text = unicodedata.normalize('NFKD', text)

    if not inject:
        return text, extracted
    print(text)
    return text
