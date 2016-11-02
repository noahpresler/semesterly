# Crazy parse ideas

from bs4 import BeautifulSoup
from bs4.element import NavigableString
import re

from scipy.fftpack import fft
from scipy import signal
import matplotlib.pyplot as plt
import numpy as np

def taggify(soup):

    # not used but could be used
    html_only = BeautifulSoup(''.join(re.findall(r'(</?\w+.*?>.*?)', soup.prettify())), 'html.parser').prettify()


    html_tags_attr = ''.join(re.findall(r'(</?\w+.*?>)|/n+?', soup.prettify()))
    # print html_tags_attr
    # exit(1)
    html_tags_only = '<' + '><'.join(re.findall(r'<(.*?\w+)\s+\w+.*?>', html_tags_attr)) + '>'
    html_tags = BeautifulSoup(html_tags_only, 'html.parser').prettify()
    print html_tags

    return html_only

def analyze(pretty_html):

    # print pretty_html

    depths = np.array([len(l) - len(l.lstrip(' ')) for l in pretty_html.splitlines()])

    # perform fft
    N = len(depths)
    T = 1.0
    yf = fft(depths)

    # window fft
    w = signal.blackman(N)
    ywf = fft(depths*w)

    xf = np.linspace(0.0, 1.0/(2.0*T), N/2)

    # create plot window
    plt.figure(1)

    # plot time domain
    plt.subplot(211)
    plt.plot(depths)
    plt.xlabel('line #')
    plt.ylabel('indentation level')
    plt.grid()

    # plot frequency space
    plt.subplot(212)
    plt.plot(xf, 2.0/N * np.abs(yf[0:N/2]))
    # plt.plot(xf, 2.0/N * np.abs(ywf[0:N/2]))
    plt.xlabel('frequency')

    b, a = signal.butter(5, [0.055, 0.065], 'band', analog=True)
    w, h = signal.freqs(b, a)
    plt.plot(w, abs(h))

    # yff = signal.filtfilt(b, a, 2.0/N * np.abs(ywf[0:N/2]))
    # plt.plot(xf[0:N/2], yff)

    plt.ylim(ymax = 0.5)
    plt.xlim(xmax = 0.3)
    plt.grid()
    plt.legend(['FFT', 'windowed FFT', 'bandpass', 'applied bp'])


    plt.show()

def main():

    file = open('scripts/parse_strategies/ex1.html', 'r')
    print file.read()
    pretty_html = taggify(BeautifulSoup(file.read(), 'html.parser'))
    print pretty_html
    analyze(pretty_html)

if __name__ == "__main__":
    main()