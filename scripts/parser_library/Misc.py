# @what     Parsing library Misc methods
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/26/16

def isfloat(subject):
	try:
		float(subject)
		return True
	except ValueError:
		return False