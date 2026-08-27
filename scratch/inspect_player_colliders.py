import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Let's find Player_FirstPersonResponder and its entire child hierarchy
p_match = re.search(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Name: Player_FirstPersonResponder', text)
if not p_match:
    p_match = re.search(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Name: Player[^\n]*Responder', text)

print('Player GameObject:', p_match.group(1) if p_match else 'Not found')

# Find all transforms in scene
tr_pattern = re.compile(r'--- !u!4 &(\d+)\nTransform:.*?\n  m_GameObject: \{fileID: (\d+)\}\n.*?\n  m_Children: ((?:  - \{fileID: \d+\}\n)*)  m_Father: \{fileID: (\d+)\}', re.DOTALL)
trs = tr_pattern.findall(text)

tr_by_go = {go: (tid, father, re.findall(r'fileID: (\d+)', children)) for tid, go, children, father in trs}
go_by_tr = {tid: go for tid, go, children, father in trs}

# Find all GameObjects
go_pattern = re.compile(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Component:\n((?:  - component: \{fileID: \d+\}\n)+)  m_Layer: \d+\n  m_Name: ([^\n]+)', re.DOTALL)
gos = {gid: {'name': name, 'comps': re.findall(r'fileID: (\d+)', comps)} for gid, comps, name in go_pattern.findall(text)}

def get_descendants(go_id):
    desc = [go_id]
    if go_id in tr_by_go:
        tid, father, children_tr = tr_by_go[go_id]
        for ctr in children_tr:
            if ctr in go_by_tr:
                cgo = go_by_tr[ctr]
                desc.extend(get_descendants(cgo))
    return desc

if p_match:
    pid = p_match.group(1)
    descendants = get_descendants(pid)
    print(f'Player [{pid}] has {len(descendants)} descendant GameObjects:')
    
    collider_types = {'65': 'BoxCollider', '64': 'MeshCollider', '135': 'SphereCollider', '136': 'CapsuleCollider', '143': 'CharacterController'}
    
    for d in descendants:
        dname = gos.get(d, {}).get('name', 'Unknown')
        dcomps = gos.get(d, {}).get('comps', [])
        for cid in dcomps:
            # check component type
            cm = re.search(r'--- !u!(\d+) &' + cid + r'\n', text)
            if cm and cm.group(1) in collider_types:
                print(f'   GO [{d}] "{dname}" -> Has {collider_types[cm.group(1)]} (Component ID: {cid})')
