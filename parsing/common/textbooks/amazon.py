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

# @what     Amazon API function definition
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     2/22/17

 # NOTE: slowly move toward Python3
from django.utils.encoding import smart_str

from amazonproduct import API
api = API(locale='us')

def eval_field(response, field):
    try:
        return smart_str(eval(field))
    except:
        return '' # TODO - change to 'Cannot be found'

def amazon_textbook_fields(isbn):
    response = None
    try:
        if len(isbn) == 9:
            response = api.item_lookup(isbn, IdType='ISBN', SearchIndex='Book', ResponseGroup='Large')
        elif len(isbn) == 13:
            response = api.item_lookup(isbn, IdType='EAN', SearchIndex='All', ResponseGroup='Large')
    except Exception as e:
        pass

    if response is None:
        return None

    return {
        'detail_url': eval_field(response, "response.Items.Item.DetailPageURL"),
        'image_url' : eval_field(response, "response.Items.Item.MediumImage.URL"),
        'author':     eval_field(response, "response.Items.Item.ItemAttributes.Author"),
        'title':      eval_field(response, "response.Items.Item.ItemAttributes.Title")
    }