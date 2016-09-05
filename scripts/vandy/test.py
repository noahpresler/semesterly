import requests, cookielib, re, sys
from bs4 import BeautifulSoup

s = requests.Session()

headers = {
    'Pragma': 'no-cache',
    'Accept-Encoding': 'gzip, deflate, sdch',
    'Accept-Language': 'en-US,en;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.48 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
}

r = s.get('https://login.mis.vanderbilt.edu/login?service=https%3A%2F%2Fwebapp.mis.vanderbilt.edu%2Fmore%2Fj_spring_cas_security_check', headers=headers)
html = r.text
soup = BeautifulSoup(html, 'html.parser')
# <input type="hidden" name="lt" value="_cA32918A7-97AD-2ED9-2B6B-186F59E40DBF_kFB475A25-0221-9750-AB55-CBE61F7BECF7" />
lt = soup.find('input', {'name': 'lt'}).get('value')
print lt

headers = {
    'Pragma': 'no-cache',
    'Origin': 'https://login.mis.vanderbilt.edu',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.48 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Referer': 'https://login.mis.vanderbilt.edu/login?service=https%3A%2F%2Fwebapp.mis.vanderbilt.edu%2Fmore%2Fj_spring_cas_security_check',
    'Connection': 'keep-alive',
}

data = 'username=khanaf&password=Gainz%2123&lt=' + lt + '&_eventId=submit&submit=LOGIN'

r = s.post('https://login.mis.vanderbilt.edu/mis-cas/login;jsessionid=' + requests.utils.dict_from_cookiejar(s.cookies)['JSESSIONID'] + '?service=https%3A%2F%2Fwebapp.mis.vanderbilt.edu%2Fmore%2Fj_spring_cas_security_check', headers=headers, cookies=s.cookies, data=data, allow_redirects=False)

print r.status_code
loc = r.headers['location']
print loc #should have the damn ticket


headers = {
    'Pragma': 'no-cache',
    'Accept-Encoding': 'gzip, deflate, sdch',
    'Accept-Language': 'en-US,en;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.48 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://login.mis.vanderbilt.edu/mis-cas/login?service=https%3A%2F%2Fwebapp.mis.vanderbilt.edu%2Fmore%2Fj_spring_cas_security_check',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
}

r=s.get(loc, headers=headers, cookies=s.cookies)
print r.text
print requests.utils.dict_from_cookiejar(s.cookies)