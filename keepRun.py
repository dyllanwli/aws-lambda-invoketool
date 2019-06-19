import os 

cmd = 'node screenshot-invoke.js > temp.txt'

for i in range(100):
    os.system(cmd).read()