import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Let's inspect objects in the corridor X: [-4, 4], Z: [-13, 18], Y: [0, 3]
chunks = text.split('--- !u!1 &')
print('=== Objects in Walking Corridor (X: -4 to 4, Z: -13 to 18) ===')

for chunk in chunks[1:]:
    lines = chunk.split('\n')
    go_id = lines[0].split()[0]
    name_line = [l for l in lines if 'm_Name: ' in l]
    name = name_line[0].replace('m_Name: ', '').strip() if name_line else 'Unknown'
    
    tr_match = re.search(r'--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + go_id + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
    if tr_match:
        px, py, pz = [float(v) for v in tr_match.groups()]
        if -4.0 <= px <= 4.0 and -13.0 <= pz <= 18.0:
            # Check if this object has a collider
            has_collider = any(f'--- !u!{c} &' in text for c in ['65', '135', '136', '64'])
            print(f'[{go_id}] "{name}" at ({px:.2f}, {py:.2f}, {pz:.2f})')
