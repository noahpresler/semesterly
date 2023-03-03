echo "Running black..."
black .
echo "Running Prettier..."
npx prettier "**/*.{js,jsx,ts,tsx}" --write
echo "Running ESLint..."
npx eslint . --ext .js,.jsx,.ts,.tsx --fix
echo "Done!"