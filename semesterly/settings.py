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

"""
Django settings for the semesterly project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

import djcelery
import os
import yaml

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROJECT_DIRECTORY = os.getcwd()
PARSING_MODULE = 'parsing'


def get_secret(key):
    """
    Returns the value for a secret by the given key.
    Will first look for a corresponding environment variable.
    If this fails, checks semesterly/sensitive.py.
    """
    try:
        return os.environ[key]
    except KeyError:
        try:
            from sensitive import SECRETS
            return SECRETS[key]
        except:
            try:
                from dev_credentials import SECRETS
                return SECRETS[key]
            except:
                raise ValueError("""'%s' not correctly configured.
                Try adding it to the file semesterly/sensitive.py.
                If this fails only on travis, make sure get_secret
                is not called globally. Wrap the call within a closure
                such as @classmethod def new(cls).""" % key)

SECRET_KEY = get_secret('SECRET_KEY')

DEBUG = False

TEMPLATE_DEBUG = DEBUG

ALLOWED_HOSTS = ['*']

SOCIAL_AUTH_FACEBOOK_SCOPE = [
    'email',
    'user_friends',
]
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {
    'fields': 'id,name,email,gender'
}

SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar'
]
SOCIAL_AUTH_GOOGLE_OAUTH2_AUTH_EXTRA_ARGUMENTS = {
    'access_type': 'offline',  # Enables the refreshing grant
    'approval_promt': 'force'  # Enables refresh_token
}


SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/'
SOCIAL_AUTH_LOGIN_ERROR_URL = '/'

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = get_secret('SOCIAL_AUTH_GOOGLE_OAUTH2_KEY')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = get_secret('SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET')
SOCIAL_AUTH_FACEBOOK_KEY = get_secret('SOCIAL_AUTH_FACEBOOK_KEY')
SOCIAL_AUTH_FACEBOOK_SECRET = get_secret('SOCIAL_AUTH_FACEBOOK_SECRET')

SOCIAL_AUTH_AUTHENTICATION_BACKENDS = (
    'social.backends.facebook.FacebookOAuth2',
    'social.backends.google.GooglePlusAuth',
    'social.backends.google.GoogleOAuth2',
)
FIELDS_STORED_IN_SESSION = ['student_token','login_hash']

SOCIAL_AUTH_PIPELINE = (
    # Get the information we can about the user and return it in a simple
    # format to create the user instance later. On some cases the details are
    # already part of the auth response from the provider, but sometimes this
    # could hit a provider API.
    'social.pipeline.social_auth.social_details',

    # Get the social uid from whichever service we're authing thru. The uid is
    # the unique identifier of the given user in the provider.
    'social.pipeline.social_auth.social_uid',

    # Verifies that the current auth process is valid within the current
    # project, this is where emails and domains whitelists are applied (if
    # defined).
    'social.pipeline.social_auth.auth_allowed',

    # Checks if the current social-account is already associated in the site.
    'social.pipeline.social_auth.social_user',

    # Make up a username for this person, appends a random string at the end if
    # there's any collision.
    'social.pipeline.user.get_username',

    # Send a validation email to the user to verify its email address.
    # Disabled by default.
    # 'social.pipeline.mail.mail_validation',

    # Associates the current social details with another user account with
    # a similar email address. Disabled by default.
    # 'social.pipeline.social_auth.associate_by_email',
    'authpipe.utils.associate_students',

    # Create a user account if we haven't found one yet.
    'social.pipeline.user.create_user',

    # Create the record that associated the social account with this user.
    'social.pipeline.social_auth.associate_user',

    # Populate the extra_data field in the social record with the values
    # specified by settings (and the default ones like access_token, etc).
    'social.pipeline.social_auth.load_extra_data',

    # Update the user record with any changed info from the auth service.
    'social.pipeline.user.user_details',
    'authpipe.utils.create_student',
)

# Webpack

WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'bundles/',
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json'),
    }
}

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'social.apps.django_app.default',
    'django_extensions',
    'authpipe',
    'timetable',
    'exams',
    'integrations',
    'searches',
    'courses',
    'analytics',
    'scripts',
    'student',
    'cachalot',
    'rest_framework',
    'rest_framework_swagger',
    'webpack_loader',
    'djcelery',
    'agreement',
    'parsing',
)

REST_FRAMEWORK ={
    'UNICODE_JSON': False
}

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'semesterly.middleware.subdomain_middleware.SubdomainMiddleware',
    'social.apps.django_app.middleware.SocialAuthExceptionMiddleware',
    'rollbar.contrib.django.middleware.RollbarNotifierMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
   'django.contrib.auth.context_processors.auth',
   'django.core.context_processors.debug',
   'django.core.context_processors.i18n',
   'django.core.context_processors.media',
   'django.core.context_processors.static',
   'django.core.context_processors.tz',
   'django.contrib.messages.context_processors.messages',
   'social.apps.django_app.context_processors.backends',
   'social.apps.django_app.context_processors.login_redirect',
)

AUTHENTICATION_BACKENDS = (
    'social.backends.facebook.FacebookOAuth2',
    'social.backends.google.GoogleOAuth2',
    'social.backends.twitter.TwitterOAuth',
    'django.contrib.auth.backends.ModelBackend',
)

ROOT_URLCONF = 'semesterly.urls'

WSGI_APPLICATION = 'semesterly.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': '',  # os.path.join(BASE_DIR, 'db.postgresql')
        'USER': '',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Logging
with open(os.path.join(os.path.dirname(__file__), 'logging.yaml'), 'r') as f:
    LOGGING = yaml.safe_load(f.read().format(
        handlers_file_filename=os.path.join(os.path.dirname(__file__),
                                            'logfile.log')
    ))

ADMINS = [
    ('Rohan Das', 'rohan@semester.ly'),
    ('Felix Zhu', 'felix@semester.ly'),
    ('Noah Presler', 'noah@semester.ly'),
    ('Eric Calder', 'eric@semester.ly'),
]

STAGING_NOTIFIED_ADMINS = ['rohan@semester.ly', 'noah@semester.ly']

EMAIL_USE_TLS = True
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587

DEFAULT_FROM_EMAIL = 'semesterly.logging@gmail.com'
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'EST'

USE_I18N = True

USE_L10N = True

USE_TZ = True

APPEND_SLASH = True

TEST_RUNNER = 'helpers.test.test_runners.FastTestRunner'

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(PROJECT_DIRECTORY,'static'),

)

STATIC_ROOT=""


TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_DIRS = (
    os.path.join(PROJECT_DIRECTORY,'templates/'),
    os.path.join(PROJECT_DIRECTORY,'semesterly/templates/'),
)

# Caching
CACHES = {
    'default': {
        'BACKEND':'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION':'127.0.0.1:11211',
    }
}
CACHALOT_ENABLED = True

try:
    from local_settings import *
except:
    pass

if not DEBUG:
    ROLLBAR = {
        'access_token': '23c5a378cd1943cfb40d5217dfb7f766',
        'environment': 'development' if DEBUG else 'production',
        'root': BASE_DIR,
    }
    import rollbar
    rollbar.init(**ROLLBAR)


# Begin Celery stuff.
djcelery.setup_loader()

BROKER_URL = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_RESULT_BACKEND = 'djcelery.backends.database:DatabaseBackend'
CELERYBEAT_SCHEDULER = 'djcelery.schedulers.DatabaseScheduler'
CELERY_TIMEZONE = 'America/New_York'

# App instance to use
CELERY_APP = "semesterly"

# Where to chdir at start.
CELERYBEAT_CHDIR = BASE_DIR
CELERYD_CHDIR = BASE_DIR

# # Can set up cron like scheduling here.
# from celery.schedules import crontab
# CELERYBEAT_SCHEDULE = {}

# End Celery stuff.
