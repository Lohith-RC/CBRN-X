import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Let's find INT_GasDetector_Spectrometer and 3M_PID_Gas_Detector in text
for name in ['INT_GasDetector_Spectrometer', '3M_PID_Gas_Detector', 'PPE_HeavyDuty_Workbench', 'HazmatVest_Folded_1']:
    print(f'=== {name} ===')
    matches = list(re.finditer(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Name: ' + re.escape(name), text, re.DOTALL))
    for m in matches:
        gid = m.group(1)
        # find transform
        trm = re.search(r'--- !u!4 &(\d+)\nTransform:.*?\n  m_GameObject: \{fileID: ' + gid + r'\}\n.*?\n  m_LocalPosition: \{x: ([-\d.e]+), y: ([-\d.e]+), z: ([-\d.e]+)\}', text, re.DOTALL)
        if trm:
            tid, px, py, pz = trm.groups()
            print(f'  GO [{gid}] Trans [{tid}] at pos: ({float(px):.3f}, {float(py):.3f}, {float(pz):.3f})')
