"""Filler."""

import re

UNICODE_WHITESPACE = re.compile(r'(?:\u00a0)|(?:\xc2)|(?:\xa0)', re.IGNORECASE)


def clean(dirt):
    """Recursively clean json-like object.

    `list`::
        - remove `None` elements
        - `None` on empty list

    `dict`::
        - filter out None valued key, value pairs
        - `None` on empty dict

    `basestring`::
        - convert unicode whitespace to ascii
        - strip extra whitespace
        - None on empty string

    Args:
        dirt: the object to clean

    Returns:
        Cleaned `dict`, cleaned `list`, cleaned `string`, or pass-through.
    """
    cleaned = None

    if isinstance(dirt, dict):
        cleaned = {}
        for k, v in dirt.items():
            cleaned_value = clean(v)
            if cleaned_value is None:
                continue
            cleaned[k] = cleaned_value
    elif isinstance(dirt, list):
        cleaned = filter(
            lambda x: x is not None,
            map(clean, dirt)
        )
    elif isinstance(dirt, basestring):
        cleaned = UNICODE_WHITESPACE.sub(' ', dirt).strip()
    else:
        return dirt

    if len(cleaned) == 0:
        return None
    return cleaned


def make_list(x):
    """Wrap in list if not list already.

    Args:
        x: Input.

    Returns:
        list: Input wrapped in list.
    """
    if not isinstance(x, list):
        x = [x]
    return x
