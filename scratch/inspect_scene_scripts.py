import re, glob

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

scripts = set(re.findall(r'm_Script: \{fileID: 11500000, guid: ([a-f0-9]+)', text))
guid_map = {}

for m in glob.glob('Assets/**/*.meta', recursive=True):
    with open(m, 'r') as mf:
        content = mf.read()
        m_guid = re.search(r'guid:\s*([a-f0-9]+)', content)
        if m_guid:
            guid_map[m_guid.group(1)] = m.replace('.meta', '')

print('=== Custom Scripts Found in Scene ===')
for s in scripts:
    name = guid_map.get(s, f'Unknown GUID ({s})')
    print(f' - {name}')
