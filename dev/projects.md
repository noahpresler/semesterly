# Starting New Projects

This is only relevant if you are working on a project that will take multiple weeks. It
tells you how to create a Github Project and create a feature branch that everyone has
access to.

## Creating The Project

1. Begin by going to our [GitHub
   repository](https://github.com/jhuopensource/semesterly/projects) under projects and
   if your project does not already exist, hit `New project`.

2. Give your Project an appropriate name and description, and then for `Project
   template` select 'Automated kanban with reviews`. This should show you your project
   board.

3. From there, in `To do`, remove the automatically generated cards. In here, you can
   add cards and convert them into issues. If you already have some issues that you want
   to note down, this is where you can make them.


## Creating a Feature Branch

**Note:** You do not have to do this if you are the only one working on the branch. Just
create your own local branch and create a PR there.

1. Make sure you are on the `develop` branch in the [Github
   repository](https://github.com/jhuopensource/semesterly). Click on the dropdown where
   you can search or create a branch, and create a branch from here called
   `feature/your-feature-name`.

2. In your editor now, `git fetch upstream` and `git checkout feature/your-feature-name`
   to switch to the branch you just created.

3. For each file in [.github/workflows/], you want to add your branch to the `branches`
   section. This is to enable the linters and automated tests workflow to run on your
   newly created branch.

4. Commit the change to upstream and create a PR; make sure that the PR is from
   jhuopensource instead of your forked repository. You will have to set the base
   repository to `jhuopensource` and the base branch to `develop`. Everyone can now
   checkout the PR and branch off the feature branch to begin work.

