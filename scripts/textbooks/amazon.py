from __future__ import print_function # NOTE: slowly move toward Python3
from amazonproduct import API
import sys
api = API(locale='us')

def amazon_textbook_fields(isbn):
    response = None
    try:
        if len(isbn) == 9:
            response = api.item_lookup(isbn, IdType='ISBN', SearchIndex='Book', ResponseGroup='Large')
        elif len(isbn) == 13:
            response = api.item_lookup(isbn, IdType='EAN', SearchIndex='All', ResponseGroup='Large')
    except:
        print("Textbook NOT FOUND for " + isbn, sys.stderr)

    if response is None:
        return {}

    return {
        'detail_url': str(response.Items.Item.DetailPageURL),
        'image_url' : str(response.Items.Item.MediumImage.URL),
        'author':     str(response.Items.Item.ItemAttributes.Author),
        'title':      str(response.Items.Item.ItemAttributes.Title)
    }