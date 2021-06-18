.. _contributing:

How to Contribute
=================

Contributing to Semester.ly follows the following simple workflow:

    1. `Fork the Repository`_
    2. `Make Changes (fix a bug, create a feature)`_
    3. `Open a Pull Request (and see your code go live!)`_
   

Fork the Repository
~~~~~~~~~~~~~~~~~~~
Follow the instructions in the installation portion of the documentation, see :ref:`setup`

Make Changes (fix a bug, create a feature)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Add the Upstream Repo
#####################

    You're going to want to add the original project repo as an upstream repo in your forked project:

    .. code-block:: bash

        git remote add upstream git@github.com:jhuopensource/semesterly.git

    This way you can push to your fork as "origin" and the main repo as "upstream". You'll only ever do this once.

Syncing With Upstream
#####################
    To stay up to date with upstream/master, you'll consistently want to checkout the master branch, fetch the upstream changes. Merge these into your local master branch and push that merge. These lines do exactly that:

    .. code-block:: bash

        git checkout master
        git fetch upstream
        git merge upstream/master
        git push origin master

Create a Working Branch
#######################
    Now you'll want to checkout a branch off master to work on. This is the branch you will merge into upstream when you are done. Just do: 

    .. code-block:: bash

        git checkout -b mybranchname

Make Some Changes, Add and Commit
#################################
    After you've made edits, git add your files, then commit. One way to do this: 

    .. code-block:: bash

        git commit -a
        git push origin mybranchname

    .. note:: 
        **What If Upstream Has Changed?** Just pull and rebase onto those changes and push. You may find conflicts, that's to be expected!

        .. code-block:: bash

            git pull --rebase upstream master
            git push origin mybranchname

Open a Pull Request (and see your code go live!)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

So you've made your changes, and you've pushed them to your branch. To open a PR, simply head over to your fork at: https://github.com/YOURGITHUBUSERNAME/semesterly. Click on "Pull Request", choose the upstream repo "master" as the destination, and your forked repo's branch (the one you've been working on) as the source, and pick the merge and squash option!

Awesome! You've made a PR. Once it's merged, your code will be a part of the Semester.ly open source GitHub repository and will be deployed for tens of thousands of students to use/benefit from. 

.. note:: A PR must pass a few checks before it can be merged.

    ✅ **LGTM:** Before your PR is merged, you'll need to pass a peer review to ensure that all the changes are clean and high quality. Usually, you'll get an "lgtm" (the comment which triggers this check to pass) or a few minor edits will be requested. This helps us maintain a quality code base and helps contrbutors learn and grow as engineers! 

    ✅ **PR Body:** Your pull request should reference a git issue if a related issue has been created. Additionally, it must provide an in depth description of why the changes were made, what they do, and how they do it. This message can be formatted as *"WHY: ...., WHAT:....., HOW:....."*, but it can take any form if this does not suit your case.

    ✅ **Tests & Builds Pass:** All tests and builds, as run by TravisCI must pass.

    ✅ **Linting Satisfied:** All files must successfully pass our code style checks. You can check that your code has no errors by running:

    .. code-block:: bash

        npm run lint
    
    You can learn more about how lint checking is done by reading :ref:`learning`.
