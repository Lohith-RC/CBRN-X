import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

target_names = [
    '3M_PID_Gas_Detector',
    'INT_GasDetector_Spectrometer',
    'PROP_GasDetector_WallDock',
    'FP_GasDetector_HeldModel',
    'Held_GasDetector_PID',
    'Detector_Shelf'
]

for name in target_names:
    print(f'=== Searching for "{name}" ===')
    # find gameobject
    go_matches = re.finditer(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Name: ' + re.escape(name), text, re.DOTALL)
    for gm in go_matches:
        go_id = gm.group(1)
        # find transform
        tr_match = re.search(r'--- !u!4 &\d+\nTransform:.*?\nm_GameObject: \{fileID: ' + go_id + r'\}'
                             r'|--- !u!4 &\d+\nTransform:.*?\n  m_GameObject: \{fileID: ' + go_id + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
        if tr_match:
            # get full transform block
            snippet = text[tr_match.start():tr_match.start()+700]
            pos_match = re.search(r'm_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', snippet)
            father_match = re.search(r'm_Father: \{fileID: (\d+)\}', snippet)
            pos = pos_match.groups() if pos_match else ('?')
            father = father_match.group(1) if father_match else '0'
            print(f'  GO [{go_id}] at LocalPos: {pos} | Father: {father}')
