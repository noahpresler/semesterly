import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
from timetable.models import *
from django.utils.encoding import smart_str, smart_unicode
from timetable.models import Textbook, TextbookLink
from amazonproduct import API
api = API(locale='us')

# NOTE: (mostly) copied from base bn parser, need to do full integration
def get_amazon_fields(isbn):
    try:
        result = api.item_lookup(isbn.strip(), IdType='ISBN', SearchIndex='Books', ResponseGroup='Large')
        info = {
            "DetailPageURL" : self.get_detail_page(result),
            "ImageURL" : self.get_image_url(result),
            "Author" : self.get_author(result),
            "Title" : self.get_title(result)
        }
    except:
        import traceback
        traceback.print_exc()
        info = {
            "DetailPageURL" : "Cannot be found",
            "ImageURL" : "Cannot be found",
            "Author" : "Cannot be found",
            "Title" : "Cannot be found"
        }
    return info

def get_detail_page(result):
    return smart_str(result.Items.Item.DetailPageURL)

def get_image_url(result):
    return smart_str(result.Items.Item.MediumImage.URL)

def get_author(result):
    return smart_str(result.Items.Item.ItemAttributes.Author)

def get_title(result):
    return smart_str(result.Items.Item.ItemAttributes.Title)
