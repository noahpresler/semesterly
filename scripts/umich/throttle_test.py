# Testing throttling
# Send burst of 60 requests (after waiting for each response)
import requests
import os, sys, re, json 
import time
from itertools import cycle

class requestor():
	def __init__(self):
		self.url = "http://api-gw.it.umich.edu/Curriculum/SOC/v1/Terms"		
		
	def start(self, num_reqs, school, epochs=1):
		resp_times = []
		tokens = ["5562e94b39dccc2eaaab181e0c4ee", "6e15388418fa2483841755f5e2d5eba", "c03cae2d767ab4c525d1ce5b57a965"]
		tok_cyc = cycle(tokens)
		for i in range(epochs):
			start = time.time()
			token = tok_cyc.next()
			print("Using token: %s" % token)
			self.sendRequests(token, num_reqs, school)
			token = tok_cyc.next()
			print("Using token: %s" % token)
			self.sendRequests(token, num_reqs, school)
			token = tok_cyc.next()
			print("Using token: %s" % token)
			self.sendRequests(token, num_reqs, school)
			end = time.time()
			print("Time taken for %i requests: %f" % (num_reqs, end-start))
			diff = end - start
			print("Waiting %f seconds"%(40))
			print("----------")
			time.sleep(40)
			resp_times.append(diff)

		print("Average response time for % request bursts: %f" % (num_reqs, sum(resp_times)/float(len(resp_times))))

	# Sends requests to get subjects for specific school
	def sendRequests(self, token, num_reqs, school):
		url = self.url+ "/2110/Schools/" + str(school) + "/Subjects"
		
		header = {	"Authorization" : "Bearer " + str(token), \
						"Accept": 'application/json', "User-Agent": "curl/7.35.0"}	
		for i in range(num_reqs):
			r = requests.get(url, headers = header, verify = True)
			if r.status_code == 200:
				parsed = json.loads(r.text)
				print("Success!")
			else:
				print("Fail!")
			

def main():
	request = requestor()
	num_reqs, school, epochs = 60, "ENG", 5
	request.start(num_reqs, school, epochs)

if __name__ == "__main__":
	main()