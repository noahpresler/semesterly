import os, sys, django, pickle
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "semesterly.settings")
django.setup()
import numpy as np

from scipy.sparse import lil_matrix
from timetable.models import *
from analytics.models import *
from student.models import *

#write to file
feat_trix = pickle.load(open("timetable.features", "rb"))