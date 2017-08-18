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

from amazon.api import AmazonAPI
from amazon.api import AsinNotFound

from semesterly.settings import get_secret

# NOTE: acts as cache for AmazonAPI
amazon = None


def amazon_textbook_fields(isbn):
    if amazon is None:
        amazon = AmazonAPI(get_secret('AMAZON_ACCESS_KEY'),
                           get_secret('AMAZON_SECRET_KEY'),
                           get_secret('AMAZON_ASSOC_TAG'))
    try:
        product = amazon.lookup(ItemId=isbn,
                                IdType='ISBN',
                                SearchIndex='Books')
    except AsinNotFound:
        return

    if isinstance(product, list):
        product = product[0]

    return {
        'detail_url': product.detail_page_url,
        'image_url': product.medium_image_url,
        'author': product.author,
        'title': product.title,
    }
