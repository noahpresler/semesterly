.. _styleguide:

Style Guide
===========

Javascript/Typescript Style Guide
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1. We follow the ESLint style guideline as configured in our ``.eslintrc.js`` file.

2. We format our frontend code using Prettier.

3. Use PascalCase for React components, camelCase for everything else.

4. When creating new components, make them **functional** components.

5. When adding Redux state, make them **slices**.

As you can see, we are shifting towards using functional React components and Redux
Toolkit with TypeScript. As such, all new features are expected to use these
technologies. If you find that you can achieve what you are trying to do more easily by
refactoring a class-based component to a functional component, or a reducer to a slice,
you are encouraged to do so.

Python Style Guide
~~~~~~~~~~~~~~~~~~

1. We follow the pycodestyle style guide for Python, with the exception that the
max-line-length is 88 instead of 79. This is to comply with the default settings of the
autoformatter black.

2. Use snake_case for variable names and functions. Use PascalCase for classes. Use
f-strings over ``%s`` strings or ``.format()``.

3. Use type annotations when the type of a variable is ambiguous.

4. If possible, helper functions go *after* the function they appear in. Do not put them
before the method as is commonly done in languages like C.