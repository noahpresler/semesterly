# -*- coding: utf-8 -*-
from django.db import models
from django.forms import ModelForm
import student.models as student_models
# Create your models here.
class StudentForm(ModelForm):
	class Meta:
		model = student_models.Student
		fields = ['first_name', 'last_name', 'hopid', 'jhed', 'major', 'class_year', 'pre_health', 'disabilities']

