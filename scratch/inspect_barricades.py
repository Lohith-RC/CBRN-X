import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pattern = re.compile(r'--- !u!1 &(\d+)\nGameObject:.*?\n  m_Name: (ENV_Barricade[^\n]+)', re.DOTALL)
print('Barricades:', pattern.findall(text))
