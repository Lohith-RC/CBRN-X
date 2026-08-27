import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Match all GameObjects and their positions
chunks = text.split('--- !u!1 &')
for c in chunks[1:]:
    lines = c.split('\n')
    gid = lines[0].split()[0]
    name_l = [l for l in lines if 'm_Name: ' in l]
    if not name_l: continue
    name = name_l[0].replace('m_Name: ', '').strip()
    
    if any(k in name.lower() for k in ['vest', 'glove', 'mask', 'respirator', 'workbench', 'detector', 'pid', 'spectrometer']):
        trm = re.search(r'--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + gid + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
        if trm:
            px, py, pz = trm.groups()
            print(f'GO [{gid}] "{name}" -> pos: ({float(px):.2f}, {float(py):.2f}, {float(pz):.2f})')
