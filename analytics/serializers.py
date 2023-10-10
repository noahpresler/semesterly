from rest_framework import serializers
from .models import UIErrorLog


class CurrentUserDefault(object):
    def set_context(self, serializer_field):
        self.user = serializer_field.context["request"].user

    def __call__(self):
        return self.user if self.user.is_authenticated else None

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class UIErrorLogSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=CurrentUserDefault())

    class Meta:
        model = UIErrorLog
        fields = "__all__"
