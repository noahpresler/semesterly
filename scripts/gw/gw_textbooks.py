from scripts.textbooks.bkstr_dot_com import BkstrDotComParser

class GWTextbookParser(BkstrDotComParser):
	def __init__(self, **kwargs):
		store_id = '10370'
		super(GWTextbookParser, self).__init__('gw', store_id, **kwargs)

def main():
	p = GWTextbookParser(hide_progress_bar=True)
	p.start()
if __name__ == '__main__':
	main()