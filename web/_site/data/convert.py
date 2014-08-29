import json

with open('data.json') as f:
    j = json.load(f)['activities']

for bid in j:
    with open(bid + '.json', 'w') as f:
        json.dump(j[bid], f, indent=4, sort_keys=True)
