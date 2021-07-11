.. _advancedconfig:

.. note:: **This step is not neccessary for most developers.** Only continue reading this section if you need to override the test secrets (API keys/credentials) provided by Semester.ly (which are for testing only).

Advanced Configuration
=======================

Semester.ly makes use of several secrets which allow it to interact securely with third party software providers. These providers include Facebook (for oauth and social graph), Google (oauth), and university APIs. 

In order for Semester.ly to run out of the box, we have included credentials to test Google and Facebook applications for development purposes. We override these keys for production use thereby keeping our client secrets... well, secrets! These provided credentials can be found in ``semesterly/dev_credentials.py``::

    SECRETS = {
        #Credentials for a test application for Semester.ly (+ Google/Facebook)
        'SECRET_KEY': ...,
        'HASHING_SALT': ...,
        'GOOGLE_API_KEY': ...,
        'SOCIAL_AUTH_GOOGLE_OAUTH2_KEY': ...,
        'SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET': ...,
        'SOCIAL_AUTH_FACEBOOK_KEY': ...,
        'SOCIAL_AUTH_FACEBOOK_SECRET': ...,
        'FB_TEST_EMAIL': ...,
        'FB_TEST_PASS': ...,
        'SOCIAL_AUTH_AZURE_TENANT_KEY': ...,
        'SOCIAL_AUTH_AZURE_TENANT_SECRET': ...,
        'SOCIAL_AUTH_AZURE_TENANT_ID': ...,
        'STUDENT_SIS_AUTH_SECRET': ...,

        #Not essential for testing, but can be filled in for advanced usage
        ...
    }

Overriding/Setting Secrets
--------------------------

However, if you wish to override these credentials or add login credentials for a school which requires a client secret, you may add your key/value pair to ``semesterly/sensitive.py``. This file is gitignored and will be kept private so you can safely store the private information you wish within this file. It should have a format indentical to SECRETS above and in ``semesterly/dev_credentials.py``.

Using Secrets
-------------

In order to properly access a secret from anywhere within the code, simply import the ``get_secret`` function and use it to access the secret by key::

    from semesterly.settings import get_secret
    hashids = Hashids(salt=get_secret('HASHING_SALT'))

This will check the following locations for the secret (in order, using the first value it finds), throwing an error if it does not find the key at all:

    1. Check OS environment variables
    2. Check ``semesterly/sensitive.py``
    3. Default to ``semesterly/dev_credentials.py``
    4. Error