from django.db import migrations


class Migration(migrations.Migration):
    """Modifies PersonalTimetable and PersonalEvent's relationship from many-to-many to
    foreign-key, in which PersonalEvent has a foreign key to a PersonalTimetable."""

    def m2m_to_fk(apps, schema_editor):
        PersonalTimetable = apps.get_model("student", "PersonalTimetable")
        for ptt in PersonalTimetable.objects.all():
            for event in ptt.events.all():
                event.timetable = ptt
                event.save()

    def fk_to_m2m(apps, schema_editor):
        Event = apps.get_model("student", "PersonalEvent")
        for event in Event.objects.all():
            if event.timetable:
                event.timetable.events.add(event)
                event.timetable.save()

    dependencies = [
        ("student", "0037_personalevent_timetable"),
    ]

    operations = [migrations.RunPython(m2m_to_fk, fk_to_m2m)]
