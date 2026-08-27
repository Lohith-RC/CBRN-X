import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Match GameObject and its transform
chunks = text.split('--- !u!1 &')
print(f'Total GameObject chunks: {len(chunks)}')

for chunk in chunks[1:]:
    lines = chunk.split('\n')
    go_id = lines[0].split()[0]
    name_line = [l for l in lines if 'm_Name: ' in l]
    name = name_line[0].replace('m_Name: ', '').strip() if name_line else 'Unknown'
    
    # Find corresponding transform in text
    # Let's search for --- !u!4 &... where m_GameObject: {fileID: go_id}
    tr_match = re.search(r'--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + go_id + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
    if tr_match:
        px, py, pz = tr_match.groups()
        lower = name.lower()
        if any(k in lower for k in ['player', 'camera', 'door', 'rollup', 'barrier', 'bollard', 'gate', 'shutter', 'entrance', 'perimeter', 'drum', 'bench']):
            print(f'[{go_id}] "{name}" -> pos: ({float(px):.2f}, {float(py):.2f}, {float(pz):.2f})')
