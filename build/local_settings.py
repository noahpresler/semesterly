import os

DEBUG = True

TEMPLATE_DEBUG = DEBUG

# This configuration relies on environment variables for DB settings

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'postgres',  # os.path.join(BASE_DIR, 'db.postgresql')
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
    }
}
