import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Match GameObject blocks
pattern = re.compile(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Component:\n((?:  - component: \{fileID: \d+\}\n)+)  m_Layer: (\d+)\n  m_Name: ([^\n]+)\n  m_TagString: ([^\n]+)', re.DOTALL)

matches = pattern.findall(text)
print(f'Total GameObjects: {len(matches)}')

keywords = ['ppe', 'mask', 'glove', 'suit', 'detector', 'spectrometer', 'containment', 'sealant', 'bench', 'dock', 'cart']

for go_id, comp_str, layer, name, tag in matches:
    lower = name.lower()
    if any(k in lower for k in keywords):
        comp_ids = re.findall(r'fileID: (\d+)', comp_str)
        # Check what types of components these are
        types = []
        for cid in comp_ids:
            header_match = re.search(r'--- !u!(\d+) &' + cid + r'\n([A-Za-z0-9_]+):', text)
            if header_match:
                types.append(f'{header_match.group(2)}(!u!{header_match.group(1)})')
            else:
                types.append(f'Unknown({cid})')
        print(f'GO [{go_id}] "{name}" | Layer: {layer} | Tag: "{tag}"')
        print(f'   Components: {", ".join(types)}')
