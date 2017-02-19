GoogleCalendar.objects.create(
      student=Student.objects.first(),
      calendar_id='noah@presler.me',
      defaults={'name': 'Noahs Cal'}
    )