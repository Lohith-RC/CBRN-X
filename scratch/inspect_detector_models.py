import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

chunks = text.split('--- !u!1 &')
print(f'Total chunks: {len(chunks)}')

for chunk in chunks[1:]:
    lines = chunk.split('\n')
    go_id = lines[0].split()[0]
    name_line = [l for l in lines if 'm_Name: ' in l]
    name = name_line[0].replace('m_Name: ', '').strip() if name_line else ''
    if any(k in name.lower() for k in ['detector', 'pid', 'spectrometer']):
        # Find Transform
        tr_match = re.search(r'--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + go_id + r'\}\n  m_LocalRotation: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+), w: ([-\d.e]+)\}\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}\n  m_LocalScale: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}\n  m_ConstrainProportionsScale: \d+\n  m_Children:.*?\n  m_Father: \{fileID: (\d+)\}', text, re.DOTALL)
        if tr_match:
            rx, ry, rz, rw, px, py, pz, sx, sy, sz, father_id = tr_match.groups()
            print(f'GO [{go_id}] "{name}" | Parent: {father_id}')
            print(f'   Pos: ({float(px):.2f}, {float(py):.2f}, {float(pz):.2f}) | Scale: ({float(sx):.2f}, {float(sy):.2f}, {float(sz):.2f})')
        else:
            print(f'GO [{go_id}] "{name}" (no standard transform match)')
