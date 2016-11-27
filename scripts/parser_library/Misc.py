# @what     Parsing library Misc methods
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/26/16

def tofloat(subject, default=None):
	try:
		return float(subject)
	except ValueError:
		return default

def toint(subject, default=None):
	try:
		return int(subject)
	except ValueError:
		return default