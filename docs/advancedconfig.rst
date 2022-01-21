.. _advancedconfig:

Advanced Configuration
=======================

VSCode Extensions
-----------------

.. tip:: 

    Previously in :ref:`setup`, we told you to install the `remote containers extension by
    Microsoft
    <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers>`_.
    When you ``docker-compose up``, in the Docker tab when right-clicking a container,
    you should see ``Attach Visual Studio Code`` in addition to ``Attach Shell``. It is
    recommended that you develop (and install these extensions) while using VSCode
    attached to the container in order to match the build environment.

Extensions can help you be more productive when working on Semester.ly code. Feel free
to ask current developers what extensions they use. Here are a few we suggest:

1. `Python + PyLance <https://marketplace.visualstudio.com/items?itemName=ms-python.python>`_.
With this extension, you can set your default formatter (black) and default linter
(pycodestyle). If you choose to set pycodestyle as your linter, be sure to change
max-line-length to 88.

2. `ESLint <https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint>`_.
As one of our checks requires ESLint to be satisfied, this will save you some time.

3. `Prettier <https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode>`_.
Formats JS/TS for you. You will want to set Prettier as your default formatter, and
we suggest you set Format Document On Save to be on in your VSCode preferences.

4. `IntelliCode <https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode>`_.
Provides useful suggestions.

5. `GitHub Copilot <https://marketplace.visualstudio.com/items?itemName=GitHub.copilot>`_.
Can often write your code for you, but be sure to double check it.


Overriding/Setting Secrets
--------------------------

.. note:: 
    
    **This step is not neccessary for most developers.** Only continue reading this 
    section if you need to override the test secrets (API keys/credentials) provided by 
    Semester.ly (which are for testing only).

Semester.ly makes use of several secrets which allow it to interact securely with third
party software providers. These providers include Facebook (for oauth and social graph),
Google (oauth), and university APIs. 

In order for Semester.ly to run out of the box, we have included credentials to test
Google and Facebook applications for development purposes. We override these keys for
production use thereby keeping our client secrets... well, secrets! These provided
credentials can be found in ``semesterly/dev_credentials.py``::

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

However, if you wish to override these credentials or add login credentials for a school
which requires a client secret, you may add your key/value pair to
``semesterly/sensitive.py``. This file is gitignored and will be kept private so you can
safely store the private information you wish within this file. It should have a format
indentical to SECRETS above and in ``semesterly/dev_credentials.py``.

Using Secrets
-------------

In order to properly access a secret from anywhere within the code, simply import the
``get_secret`` function and use it to access the secret by key::

    from semesterly.settings import get_secret
    hashids = Hashids(salt=get_secret('HASHING_SALT'))

This will check the following locations for the secret (in order, using the first value
it finds), throwing an error if it does not find the key at all:

    1. Check OS environment variables
    2. Check ``semesterly/sensitive.py``
    3. Default to ``semesterly/dev_credentials.py``
    4. Error