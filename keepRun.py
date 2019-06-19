# # run 1
# import os 
# cmd = 'node screenshot-invoke.js > temp.txt'

# for i in range(100):
#     os.system(cmd).read()




# run 2
import subprocess
cmd2 = 'node screenshot-invoke.js'.split(" ")


for i in range(100):
    subPopen = subprocess.Popen(cmd2,
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT)
    stdout, stderr = subPopen.communicate()
    print(stdout, stderr)