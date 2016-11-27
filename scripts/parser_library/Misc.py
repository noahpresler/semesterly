# @what     Parsing library Misc methods
# @org      Semeseter.ly
# @author   Michael N. Miller
# @date     11/26/16

def safe_cast(val, to_type, default=None):
	try:
		return to_type(val)
	except (ValueError, TypeError):
		return default
