import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = "Assets/Textures/Generated"
os.makedirs(out_dir, exist_ok=True)

def normal_from_height(height_map, strength=2.5):
    """Generate tangent-space normal map (RGB) from height map (0-255)."""
    h_norm = height_map.astype(np.float32) / 255.0
    dx = np.zeros_like(h_norm)
    dy = np.zeros_like(h_norm)
    dx[:, 1:-1] = (h_norm[:, 2:] - h_norm[:, :-2]) * 0.5 * strength
    dy[1:-1, :] = (h_norm[2:, :] - h_norm[:-2, :]) * 0.5 * strength
    dz = np.ones_like(h_norm)
    norm = np.sqrt(dx**2 + dy**2 + dz**2)
    nx = (-dx / norm) * 0.5 + 0.5
    ny = (-dy / norm) * 0.5 + 0.5
    nz = (dz / norm) * 0.5 + 0.5
    rgb = np.stack([nx * 255, ny * 255, nz * 255], axis=2).astype(np.uint8)
    return Image.fromarray(rgb, mode='RGB')

size = 1024
np.random.seed(1337)

# =========================================================================
# 1. 1000L CHEMICAL IBC TOTE CONTAINER (Galvanized Steel Cage + HDPE Tank)
# =========================================================================
print("Generating 1000L Chemical IBC Tote Textures...")
ibc_img = Image.new("RGB", (size, size), color=(220, 235, 220)) # Translucent green-tinted HDPE
draw_ibc = ImageDraw.Draw(ibc_img)
h_ibc = np.ones((size, size), dtype=np.uint8) * 80

# Heavy galvanized tubular steel cage grid (vertical and horizontal bars)
grid_spacing = 128
for x in range(0, size + 1, grid_spacing):
    draw_ibc.rectangle([(x - 8, 0), (x + 8, size)], fill=(185, 195, 205), outline=(90, 95, 105))
    h_ibc[:, max(0, x - 8):min(size, x + 8)] = 230

for y in range(0, size + 1, grid_spacing):
    draw_ibc.rectangle([(0, y - 8), (size, y + 8)], fill=(185, 195, 205), outline=(90, 95, 105))
    h_ibc[max(0, y - 8):min(size, y + 8), :] = 230

# High-contrast hazmat Class 8 Corrosive placard
draw_ibc.polygon([(360, 512), (512, 360), (664, 512), (512, 664)], fill=(245, 245, 250), outline=(20, 20, 20))
draw_ibc.polygon([(360, 512), (512, 360), (664, 512)], fill=(20, 20, 20))
draw_ibc.text((440, 430), "CORROSIVE", fill=(255, 255, 255))
draw_ibc.text((495, 590), "8", fill=(20, 20, 20))

# Level graduation fill marks along left side
for ly in range(150, 850, 70):
    draw_ibc.line([(25, ly), (65, ly)], fill=(20, 60, 30), width=4)
    draw_ibc.text((75, ly - 8), f"{(850 - ly) * 1.25:.0f} L", fill=(20, 60, 30))

ibc_img.save(os.path.join(out_dir, "Tex_IBCTote_Albedo.png"))
normal_from_height(h_ibc, strength=3.0).save(os.path.join(out_dir, "Tex_IBCTote_Normal.png"))

# =========================================================================
# 2. HEAVY CARDBOARD HAZMAT CARGO BOXES (With Stretch Wrap Plastic)
# =========================================================================
print("Generating Hazmat Cargo Box Textures...")
box_base = np.random.normal(190, 8, (size, size))
box_r = np.clip(box_base * 1.15 + 20, 0, 255).astype(np.uint8)
box_g = np.clip(box_base * 0.92 + 10, 0, 255).astype(np.uint8)
box_b = np.clip(box_base * 0.65, 0, 255).astype(np.uint8)

box_img = Image.fromarray(np.stack([box_r, box_g, box_b], axis=2), mode='RGB')
draw_box = ImageDraw.Draw(box_img)

# Heavy-duty packaging tape seams
draw_box.rectangle([(0, 480), (size, 544)], fill=(215, 175, 95))
draw_box.rectangle([(480, 0), (544, size)], fill=(215, 175, 95))

# High-contrast Hazard Warning Stencils (Flammable Liquid Red Diamond & Caution Text)
draw_box.polygon([(200, 300), (300, 200), (400, 300), (300, 400)], fill=(225, 30, 20), outline=(240, 240, 245))
draw_box.text((255, 290), "FLAMMABLE", fill=(255, 255, 255))
draw_box.text((295, 360), "3", fill=(255, 255, 255))

draw_box.text((600, 220), "FRAGILE / THIS END UP", fill=(30, 30, 30))
draw_box.text((600, 250), "BATCH: CBRN-CH-8849", fill=(30, 30, 30))
draw_box.text((600, 280), "NET WT: 25.0 KG", fill=(30, 30, 30))

# Stretch wrap specular highlights
h_box = (box_base * 0.5 + 60).astype(np.uint8)
box_img.save(os.path.join(out_dir, "Tex_ChemicalBox_Albedo.png"))
normal_from_height(h_box, strength=1.5).save(os.path.join(out_dir, "Tex_ChemicalBox_Normal.png"))

# =========================================================================
# 3. 3D CAUSTIC CORROSIVE CHEMICAL SPILL CRATER (Albedo + Emissive Glow)
# =========================================================================
print("Generating Caustic Chemical Spill Textures...")
# Radial caustic acid gradient
center = size // 2
y_grid, x_grid = np.ogrid[:size, :size]
dist_from_center = np.sqrt((x_grid - center)**2 + (y_grid - center)**2)
radius = size * 0.45

# Multi-frequency noise for acid foam / bubbling texture
noise_foam = np.random.normal(0, 30, (size, size))
foam_mask = np.clip((np.sin(dist_from_center * 0.08) * 40 + noise_foam), 0, 255)

# Acid core: Vibrant Toxic Neon Chartreuse Green / Yellow (#CCFF00 / #88FF00)
acid_r = np.clip(160 - (dist_from_center / radius) * 120 + noise_foam * 0.5, 20, 240).astype(np.uint8)
acid_g = np.clip(255 - (dist_from_center / radius) * 160 + noise_foam * 0.4, 30, 255).astype(np.uint8)
acid_b = np.clip(20 + noise_foam * 0.2, 0, 60).astype(np.uint8)

spill_img = Image.fromarray(np.stack([acid_r, acid_g, acid_b], axis=2), mode='RGB')
draw_spill = ImageDraw.Draw(spill_img)

# Dark burnt corrosive edge rim & bubbling foam rings
for r_ring in [180, 260, 340, 420]:
    for angle in np.linspace(0, 2 * math.pi, 60):
        bx = int(center + (r_ring + np.random.randint(-15, 15)) * math.cos(angle))
        by = int(center + (r_ring + np.random.randint(-15, 15)) * math.sin(angle))
        br = np.random.randint(6, 22)
        draw_spill.ellipse([(bx - br, by - br), (bx + br, by + br)], fill=(210, 245, 40), outline=(60, 80, 10))

spill_img.save(os.path.join(out_dir, "Tex_CorrosiveCrater_Albedo.png"))

# Spill Emissive Glow (Intense bioluminescent chartreuse chemical glow at core)
emiss_mask = np.clip(1.0 - (dist_from_center / (radius * 0.8)), 0, 1.0)
emiss_r = (emiss_mask * 180).astype(np.uint8)
emiss_g = (emiss_mask * 255).astype(np.uint8)
emiss_b = (emiss_mask * 25).astype(np.uint8)
Image.fromarray(np.stack([emiss_r, emiss_g, emiss_b], axis=2), mode='RGB').save(os.path.join(out_dir, "Tex_CorrosiveCrater_Emissive.png"))

h_spill = np.clip(foam_mask + (1.0 - dist_from_center / radius) * 120, 0, 255).astype(np.uint8)
normal_from_height(h_spill, strength=3.5).save(os.path.join(out_dir, "Tex_CorrosiveCrater_Normal.png"))

# =========================================================================
# 4. RUGGED SAFETY-YELLOW PELICAN GEAR CASES
# =========================================================================
print("Generating Rugged Pelican Case Textures...")
pelican_img = Image.new("RGB", (size, size), color=(245, 185, 10)) # Saturated Safety Yellow
draw_pel = ImageDraw.Draw(pelican_img)
h_pel = np.ones((size, size), dtype=np.uint8) * 120

# Molded structural ribs on case lid
for ry in range(120, 900, 140):
    draw_pel.rounded_rectangle([(80, ry - 25), (944, ry + 25)], radius=15, fill=(230, 170, 5), outline=(160, 110, 0))
    h_pel[ry - 25:ry + 25, 80:944] = 200

# Black heavy-duty throw latches & purge valve
for lx in [220, 512, 804]:
    draw_pel.rounded_rectangle([(lx - 35, 930), (lx + 35, 1010)], radius=8, fill=(25, 25, 28), outline=(60, 60, 65))
    draw_pel.rounded_rectangle([(lx - 35, 14), (lx + 35, 94)], radius=8, fill=(25, 25, 28), outline=(60, 60, 65))
    h_pel[930:1010, lx - 35:lx + 35] = 240

# Center automatic pressure purge valve & Hazmat ID Label
draw_pel.ellipse([(480, 480), (544, 544)], fill=(35, 35, 40), outline=(90, 90, 95))
draw_pel.rectangle([(320, 360), (704, 440)], fill=(240, 240, 245), outline=(30, 30, 30))
draw_pel.text((360, 380), "LEVEL-B PPE RAPID DEPLOYMENT", fill=(20, 20, 20))
draw_pel.text((390, 405), "FIRST RESPONDER TACTICAL KIT", fill=(180, 30, 20))

pelican_img.save(os.path.join(out_dir, "Tex_PelicanCase_Albedo.png"))
normal_from_height(h_pel, strength=3.0).save(os.path.join(out_dir, "Tex_PelicanCase_Normal.png"))

# =========================================================================
# 5. CARBON FIBER SCBA AIR CYLINDER WITH BRASS PRESSURE GAUGE
# =========================================================================
print("Generating SCBA Cylinder Textures...")
# Carbon fiber weave pattern
cf_pattern = np.zeros((size, size, 3), dtype=np.uint8)
for i in range(0, size, 8):
    for j in range(0, size, 8):
        v = 35 if ((i // 8) + (j // 8)) % 2 == 0 else 65
        cf_pattern[i:i+8, j:j+8] = (v, v + 2, v + 5)

scba_img = Image.fromarray(cf_pattern, mode='RGB')
draw_scba = ImageDraw.Draw(scba_img)

# Saturated Bright Yellow Luminescent Band across bottle
draw_scba.rectangle([(0, 380), (size, 580)], fill=(240, 205, 10))
draw_scba.rectangle([(0, 400), (size, 430)], fill=(20, 20, 20))
draw_scba.text((size // 2 - 140, 480), "BREATHING AIR - 300 BAR (4500 PSI)", fill=(20, 20, 20))

# Stainless steel valve collar
draw_scba.rectangle([(0, 0), (size, 70)], fill=(195, 200, 210))
scba_img.save(os.path.join(out_dir, "Tex_SCBATank_Albedo.png"))
normal_from_height(cf_pattern[:, :, 0], strength=2.0).save(os.path.join(out_dir, "Tex_SCBATank_Normal.png"))

# =========================================================================
# 6. DIGITAL LED STATUS PANEL & HAZARD ALARM DISPLAY (With Emissive LEDs)
# =========================================================================
print("Generating LED Status Panel Textures...")
panel_img = Image.new("RGB", (size, 512), color=(25, 28, 32))
draw_pan = ImageDraw.Draw(panel_img)

# Bezel & meter frames
draw_pan.rectangle([(20, 20), (size - 20, 492)], fill=(38, 42, 48), outline=(75, 80, 90))

# Digital display screen (Dark green / cyan LCD)
draw_pan.rectangle([(60, 60), (500, 450)], fill=(10, 25, 18), outline=(40, 80, 60))
draw_pan.text((80, 80), "BAY 03 HAZARD MONITOR", fill=(40, 240, 120))
draw_pan.text((80, 120), "AIR QUALITY: CRITICAL TOXIC", fill=(255, 60, 50))
draw_pan.text((80, 160), "CHLORINE CONC: 185 PPM", fill=(255, 190, 20))
draw_pan.text((80, 200), "VENTILATION: OFFLINE", fill=(255, 60, 50))
draw_pan.text((80, 240), "CONTAINMENT: BREACHED", fill=(255, 40, 30))
draw_pan.text((80, 290), "MANDATORY PPE: LEVEL-B / SCBA", fill=(40, 220, 255))

# Analog Pressure Gauge dial on right
draw_pan.ellipse([(600, 100), (920, 420)], fill=(230, 235, 240), outline=(20, 20, 20))
draw_pan.arc([(620, 120), (900, 400)], start=135, end=405, fill=(180, 30, 20), width=12)
draw_pan.text((710, 320), "PRESSURE (PSI)", fill=(30, 30, 30))
# Needle in red hazard zone
draw_pan.line([(760, 260), (840, 180)], fill=(220, 20, 10), width=6)

panel_img.save(os.path.join(out_dir, "Tex_StatusPanel_Albedo.png"))

# Status Panel Emissive (Glows in dark)
panel_emiss = Image.new("RGB", (size, 512), color=(0, 0, 0))
draw_pe = ImageDraw.Draw(panel_emiss)
draw_pe.text((80, 80), "BAY 03 HAZARD MONITOR", fill=(40, 240, 120))
draw_pe.text((80, 120), "AIR QUALITY: CRITICAL TOXIC", fill=(255, 60, 50))
draw_pe.text((80, 160), "CHLORINE CONC: 185 PPM", fill=(255, 190, 20))
draw_pe.text((80, 200), "VENTILATION: OFFLINE", fill=(255, 60, 50))
draw_pe.text((80, 240), "CONTAINMENT: BREACHED", fill=(255, 40, 30))
draw_pe.text((80, 290), "MANDATORY PPE: LEVEL-B / SCBA", fill=(40, 220, 255))
panel_emiss.save(os.path.join(out_dir, "Tex_StatusPanel_Emissive.png"))

# =========================================================================
# 7. HEAVY INDUSTRIAL ROOF TRUSS STEEL
# =========================================================================
print("Generating Industrial Roof Truss Textures...")
truss_img = Image.new("RGB", (size, 256), color=(120, 128, 138))
draw_tr = ImageDraw.Draw(truss_img)
# Heavy flange borders with bolt patterns
draw_tr.rectangle([(0, 0), (size, 35)], fill=(95, 102, 112))
draw_tr.rectangle([(0, 221), (size, 256)], fill=(95, 102, 112))
for bx in range(40, size, 80):
    draw_tr.ellipse([(bx - 6, 12), (bx + 6, 24)], fill=(185, 190, 200), outline=(45, 48, 55))
    draw_tr.ellipse([(bx - 6, 232), (bx + 6, 244)], fill=(185, 190, 200), outline=(45, 48, 55))

truss_img.save(os.path.join(out_dir, "Tex_TrussSteel_Albedo.png"))
normal_from_height(np.array(truss_img.convert('L')), strength=2.2).save(os.path.join(out_dir, "Tex_TrussSteel_Normal.png"))

print("All vibrant, high-contrast disaster PBR textures synthesized successfully!")
