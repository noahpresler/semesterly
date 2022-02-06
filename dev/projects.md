# Starting New Projects

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

1. Make sure you are on the `develop` branch in the [Github
   repository](https://github.com/jhuopensource/semesterly). Click on the dropdown where
   you can search or create a branch, and create a branch from here called
   `feature/your-feature-name`.

2. In your editor now, `git checkout feature/your-feature-name` to switch to the branch
   you just created.

3. For each file in [.github/workflows/], you want to add your branch to the `branches`
   section. This is to enable the linters and automated tests workflow to run on your
   newly created branch.

4. Commit the change and create a PR; everyone can now checkout the PR and branch off
   the feature branch to begin work.

