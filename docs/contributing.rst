.. _contributing:

How to Contribute
=================

Contributing to Semester.ly follows the following simple workflow:

    1. `Create a Branch`_
    2. `Make Changes`_
    3. `Clean Up Changes`_
   

Create a Branch
~~~~~~~~~~~~~~~

Make sure you have followed all of the instructions in :ref:`setup` to set up your local
repository and upstream remote.

We follow the `Gitflow workflow
<https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow>`_; our
main branch is ``prod``, and our develop branch is ``develop``. The general gist is that
for anything new, you want to branch off of ``develop`` and name your branch
``feature/your-branch-name``. In the case you need to fix something that was just
released, and it needs to go straight to production, then branch off of ``prod`` and
name your branch ``hotfix/your-branch-name``.

To stay up to date with ``upstream/develop``, you'll want to ``git pull`` whenever you're
starting a new branch. You may need to ``git fetch upstream`` first.

.. code-block:: bash

    git checkout develop
    git pull

Then, you'll want to create a new branch.

.. code-block:: bash

    git checkout -b <your-branch-name>


Make Changes
~~~~~~~~~~~~

After you've made edits, git add your files, then commit. One way to do this: 

.. code-block:: bash

    git add <path_to_file>
    git commit -m "Topic: Message"
    git push --set-upstream origin your-branch-name

From here, you should be prompted to create a new pull request (PR). Ctrl + Left Click to
open the link. From there, add a short description on what your PR does and how/why you
did it, and then create the PR. If your PR is ready for review, add a reviewer as well.

.. note:: 
    **What If Upstream Has Changed?** If merging upstream into your branch does not 
    cause any conflicts, using rebase is a good option.

    .. code-block:: bash

        git pull --rebase upstream develop
        git push origin your-branch-name

    However, if there are merge conflicts, I suggest creating an alternate branch off of 
    your branch and then merging upstream, fixing any conflicts, and then merging back
    into your branch. Although more complicated, this saves you from messing up the work
    on your branch if the merge conflicts aren't easily resolved, or you make a mistake
    while resolving the conflicts.

    .. code-block:: bash

        git checkout develop
        git pull upstream
        git checkout your-branch-name
        git checkout -b merge-develop
        git merge develop
        (Fix merge conflicts, git add + git commit)
        git checkout your-branch-name
        git merge merge-develop
        git push


Clean Up Changes
~~~~~~~~~~~~~~~~
We have GitHub workflows that check your changes and run them against our automated
tests. While the workflow is building, we have a few other workflows that check the
style and formatting of your code, and they will run more quickly than the build flows.
Take this time to fix any formatting or linting issues should these tests fail. Refer to
the :ref:`styleguide` to learn more about our code guidelines.


.. note:: A PR must pass a few checks before it can be merged.

    ✅ **LGTM:** Before your PR is merged, you'll need to pass a peer review to ensure
    that all the changes are clean and high quality. Usually, you'll get an "LGTM" or a
    few minor edits will be requested. This helps us maintain a quality code base and
    helps contributors learn and grow as engineers! 

    ✅ **PR Body:** Your pull request should reference a git issue if a related issue has
    been created. Additionally, it must provide an in depth description of why the
    changes were made, what they do, and how they do it. 

    ✅ **Tests & Builds Pass:** All tests and builds, as run by Github Actions, must pass.

    ✅ **Linting Satisfied:** All files must successfully pass our code style checks.

    .. code-block:: bash

        npx prettier "**/*.{js,jsx,ts,tsx}" --write 
        eslint . --ext .js,.jsx,.ts,.tsx --fix
        black .
