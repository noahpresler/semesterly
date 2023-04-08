# End To End Testing

You will need to install Google Chrome in order to run the end to end tests in
`semesterly/tests.py`. You can install it with `./build/install_chrome.sh` while
attached to a shell in the `semesterly` container. To run the tests, proceed as usual
with `python manage.py test`, or if you want to run only the end to end tests, use
`python manage.py test semesterly`.

**Note**: This will only work if you are using Linux/WSL on Windows. You need to install
the driver for MacOS yourself if you want to run the tests on Mac.