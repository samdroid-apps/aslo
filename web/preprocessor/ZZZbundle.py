import os
import sys

script, root = sys.argv
files = []

for name in ['main.js', 'index.css', 'body.html', 'data.json']:
    with open(os.path.join(root, name)) as f:
        files.append(f.read().strip())

lens = ['{0:07d}'.format(len(f)) for f in files]

with open(os.path.join(root, 'bundle'), 'w') as f:
    f.write(''.join(lens + files))
