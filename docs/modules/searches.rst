Searches App
=============

Currently, searches are executed via tokenized and logically AND-ed queries to the database. We are in the process of revamping the search process to use a vectorized search approach. This will result in higher quality search results with a greater variety of use cases, including searching descriptions. For more information, see `PR#955 <https://github.com/noahpresler/semesterly/pull/955>`_.

Views
~~~~~
.. automodule:: searches.views
    :members:

Utils
~~~~~
.. automodule:: searches.utils
    :members: