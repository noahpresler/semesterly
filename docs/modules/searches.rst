Searches App
=============

Searches app provides a useful, efficient and scalable search backend using basic techniques of information retrieval.

Each course model contains a vector stored as a pickled scipy sparse vector. This vector represents this course. Upon search, a vectorizer creates a similar vector representation for that query. We then fetch ~100 candidates for serving as search results. These canidates are then sorted by the cosine similarity between their vector and the query vector.

To increase accuracy and provide for a clean search experience for key use cases, the search places a heavier weight on courses with matching titles. However, description and other fields are searched as well. 

Views
~~~~~
.. automodule:: searches.views
    :members:

Utils
~~~~~
.. automodule:: searches.utils
    :members:
