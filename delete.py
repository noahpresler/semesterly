class A(object):
	def run(self):
		print 'Running A'
	def test(self):
		print 'test'
		self.run()
class B(A):
	def __init__(self):
		super(B, self).__init__()
	def run(self):
		print 'Running B'

b = B()
b.test()
