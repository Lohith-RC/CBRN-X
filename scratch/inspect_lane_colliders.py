import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

collider_types = {'65': 'BoxCollider', '64': 'MeshCollider', '135': 'SphereCollider', '136': 'CapsuleCollider'}

pattern = re.compile(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Component:\n((?:  - component: \{fileID: \d+\}\n)+)  m_Layer: \d+\n  m_Name: ([^\n]+)', re.DOTALL)
gos = pattern.findall(text)

print('=== Colliders in Central Walking Lane (X: -2.5 to 2.5, Z: -12.5 to 10) ===')
for go_id, comps, name in gos:
    comp_ids = re.findall(r'fileID: (\d+)', comps)
    tr_match = re.search(r'--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + go_id + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
    if tr_match:
        px, py, pz = [float(v) for v in tr_match.groups()]
        if -2.5 <= px <= 2.5 and -12.5 <= pz <= 10.0 and 0.0 <= py <= 2.5:
            for cid in comp_ids:
                col_match = re.search(r'--- !u!(\d+) &' + cid + r'\n([A-Za-z0-9_]+):', text)
                if col_match and col_match.group(1) in collider_types:
                    print(f'Collider [{collider_types[col_match.group(1)]}] on "{name}" at pos ({px:.2f}, {py:.2f}, {pz:.2f})')
