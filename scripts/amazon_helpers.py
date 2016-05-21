"""Helper functions for accessing Amazon API for textbooks"""
from django.db.models import Q
from django.utils.encoding import smart_str

from amazonproduct.errors import InvalidParameterValue
from timetable.models import Section

def get_amazon_fields(isbn, api):
    try:
        result = api.item_lookup(isbn.strip(),
                                 IdType='ISBN',
                                 SearchIndex='Books',
                                 ResponseGroup='Large')
        info = {
            "DetailPageURL" : get_detail_page(result),
            "ImageURL" : get_image_url(result),
            "Author" : get_author(result),
            "Title" : get_title(result)
        }
    except InvalidParameterValue:
        print "\t\t\tInvalidParameterException. ISBN: " + isbn
        info = None

    except:
        import traceback
        traceback.print_exc()
        info = None

    return info

def get_detail_page(result):
    try:
        return smart_str(result.Items.Item.DetailPageURL)
    except:
        return "Cannot Be Found"

def get_image_url(result):
    try:
        return smart_str(result.Items.Item.MediumImage.URL)
    except:
        return "Cannot Be Found"

def get_author(result):
    try:
        return smart_str(result.Items.Item.ItemAttributes.Author)
    except:
        return "Cannot Be Found"

def get_title(result):
    try:
        return smart_str(result.Items.Item.ItemAttributes.Title)
    except:
        return "Cannot Be Found"

def get_all_sections(crs, semester):
    return list(Section.objects.filter((Q(semester__in=[semester, 'Y'])),                                            course=crs).values_list('meeting_section', flat=True).distinct())

    return sections
    