import React, {useState, useEffect} from 'react';

/*
 *
 * As for now, only two themes - light and dark. Since there's only two, it'll be implemented as a toggle.
 * However, the rest of this React component can be used to add support for other themes without having to edit too much.
 * In order to add a one or more themes, you'll have to do the following:
 *
 * 1. Modify this file so that it is no longer a toggle - rather, a dropdown or something that will accept three or more options.
 * 2. Modify the theme.scss file to add another theme - this has to match the element in availableThemes.
 * 3. Edit the availableThemes so that Typescript doesn't complain and doesn't get rejected by the initial useEffect() sanitizer.
 *
 */

// Add more themes here to have it be accepted.
const availableThemes = ['light', 'dark'];

// For typescript purposes
type Theme = typeof availableThemes[number];
const themeLocalStorageKey = "main_theme";

const ThemeToggle = () => {

    const [theme, setTheme] = useState<Theme>('light');

    // On Mount
    useEffect(() => {
        const theme = localStorage.getItem(themeLocalStorageKey);

        // Check if a theme is valid.
        if (availableThemes.indexOf(theme) !== -1) {
            setTheme(theme);
        } else {
            // Set the first element as the default theme
            setTheme(availableThemes[0])
        }
    }, []);

    // When theme changes
    useEffect(() => {

        // Remove previous theme.
        const root: Element = document.querySelector('.page');

        // Reset previous classes
        root.className = 'page';

        // Now, add the theme
        root.classList.add('theme--' + theme);
        root.setAttribute('data-theme', theme);

        // Store in localStorage
        localStorage.setItem(themeLocalStorageKey, theme);

    }, [theme]);

    return(
        <div className="theme-toggle-container">
            {theme === 'light' ?
                <i className="fa fa-moon-o" onClick={() => setTheme('dark')} /> : ''
            }
            {theme === 'dark' ?
                <i className="fa fa-sun-o" onClick={() => setTheme('light')} /> : ''
            }
        </div>
    )
}

export default ThemeToggle;