import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = "Assets/Textures/Generated"
os.makedirs(out_dir, exist_ok=True)

def normal_from_height(height_map, strength=2.0):
    """Generate tangent-space normal map (RGB) from a single-channel height map (0-255)."""
    h, w = height_map.shape
    h_norm = height_map.astype(np.float32) / 255.0
    
    # Sobel gradients
    dx = np.zeros_like(h_norm)
    dy = np.zeros_like(h_norm)
    
    dx[:, 1:-1] = (h_norm[:, 2:] - h_norm[:, :-2]) * 0.5 * strength
    dy[1:-1, :] = (h_norm[2:, :] - h_norm[:-2, :]) * 0.5 * strength
    
    # Normal vector = [-dx, -dy, 1.0] normalized
    dz = np.ones_like(h_norm)
    norm = np.sqrt(dx**2 + dy**2 + dz**2)
    
    nx = (-dx / norm) * 0.5 + 0.5
    ny = (-dy / norm) * 0.5 + 0.5
    nz = (dz / norm) * 0.5 + 0.5
    
    rgb = np.stack([nx * 255, ny * 255, nz * 255], axis=2).astype(np.uint8)
    return Image.fromarray(rgb, mode='RGB')

# =========================================================================
# 1. INDUSTRIAL WAREHOUSE CONCRETE FLOOR
# =========================================================================
print("Generating Concrete Warehouse Floor Textures...")
size = 1024
np.random.seed(42)

# Base concrete noise
noise1 = np.random.normal(145, 12, (size, size))
noise2 = np.random.normal(0, 18, (size // 4, size // 4))
noise2_img = Image.fromarray(np.uint8(np.clip(noise2 + 128, 0, 255))).resize((size, size), Image.Resampling.BICUBIC)
noise2_arr = np.array(noise2_img).astype(np.float32) - 128.0

concrete_val = np.clip(noise1 + noise2_arr * 0.6, 60, 220)

# Add slab joint grid (tile seams every 512px)
height_map = np.clip(noise1 * 0.5 + 64, 0, 255).astype(np.uint8)
h_img = Image.fromarray(height_map)
h_draw = ImageDraw.Draw(h_img)
for i in [0, 512, 1023]:
    h_draw.line([(0, i), (size, i)], fill=20, width=6)
    h_draw.line([(i, 0), (i, size)], fill=20, width=6)
height_arr = np.array(h_img)

# Concrete Albedo (RGB neutral gray with aggregate specks and subtle warm tone)
base_r = np.clip(concrete_val * 0.98 + 5, 0, 255).astype(np.uint8)
base_g = np.clip(concrete_val * 0.99 + 4, 0, 255).astype(np.uint8)
base_b = np.clip(concrete_val * 1.02, 0, 255).astype(np.uint8)

albedo_arr = np.stack([base_r, base_g, base_b], axis=2)
floor_img = Image.fromarray(albedo_arr, mode='RGB')
draw = ImageDraw.Draw(floor_img)

# Dark slab joints
for i in [0, 512, 1023]:
    draw.line([(0, i), (size, i)], fill=(45, 45, 48), width=5)
    draw.line([(i, 0), (i, size)], fill=(45, 45, 48), width=5)

# Subtle industrial tire scuffs
for _ in range(6):
    x1, y1 = np.random.randint(50, size - 50, 2)
    length = np.random.randint(120, 350)
    angle = np.random.uniform(-0.4, 0.4)
    x2 = int(x1 + length * math.cos(angle))
    y2 = int(y1 + length * math.sin(angle))
    draw.line([(x1, y1), (x2, y2)], fill=(65, 65, 70), width=np.random.randint(6, 16))

floor_img = floor_img.filter(ImageFilter.SMOOTH_MORE)
floor_img.save(os.path.join(out_dir, "Tex_WarehouseFloor_Albedo.png"))
normal_from_height(height_arr, strength=2.5).save(os.path.join(out_dir, "Tex_WarehouseFloor_Normal.png"))

# Dark Staging Safe Zone Floor
floor_dark = Image.fromarray(np.clip(albedo_arr * 0.55 + 10, 0, 255).astype(np.uint8), mode='RGB')
floor_dark.save(os.path.join(out_dir, "Tex_WarehouseFloor_Dark_Albedo.png"))

# =========================================================================
# 2. CORRUGATED INDUSTRIAL METAL WALL
# =========================================================================
print("Generating Corrugated Metal Wall Textures...")
wall_albedo = np.zeros((size, size, 3), dtype=np.uint8)
wall_height = np.zeros((size, size), dtype=np.uint8)

# Rib frequency (period = 32px)
period = 32
x = np.arange(size)
corrugation = np.sin(x * (2 * math.pi / period)) * 0.5 + 0.5 # 0 to 1
corrugation_2d = np.tile(corrugation, (size, 1))

base_gray = 135
noise_metal = np.random.normal(0, 6, (size, size))
wall_val = np.clip(base_gray + corrugation_2d * 55 + noise_metal, 50, 240)

# Shading: top of rib is brighter, valley is darker
wall_r = np.clip(wall_val * 0.95 + 10, 0, 255).astype(np.uint8)
wall_g = np.clip(wall_val * 0.98 + 8, 0, 255).astype(np.uint8)
wall_b = np.clip(wall_val * 1.02 + 12, 0, 255).astype(np.uint8)

wall_img = Image.fromarray(np.stack([wall_r, wall_g, wall_b], axis=2), mode='RGB')
draw_w = ImageDraw.Draw(wall_img)

# Rivet rows every 256px
h_wall_map = (corrugation_2d * 200 + 30).astype(np.uint8)
h_wall_img = Image.fromarray(h_wall_map)
draw_wh = ImageDraw.Draw(h_wall_img)

for ry in range(64, size, 256):
    for rx in range(period // 2, size, period):
        draw_w.ellipse([(rx - 3, ry - 3), (rx + 3, ry + 3)], fill=(210, 215, 225), outline=(50, 50, 55))
        draw_wh.ellipse([(rx - 3, ry - 3), (rx + 3, ry + 3)], fill=255)

# Horizontal sheet metal overlap seams
for sy in [0, 512, 1023]:
    draw_w.line([(0, sy), (size, sy)], fill=(40, 42, 45), width=4)
    draw_wh.line([(0, sy), (size, sy)], fill=10, width=4)

wall_img.save(os.path.join(out_dir, "Tex_CorrugatedWall_Albedo.png"))
normal_from_height(np.array(h_wall_img), strength=3.0).save(os.path.join(out_dir, "Tex_CorrugatedWall_Normal.png"))

# =========================================================================
# 3. CHEMICAL DRUM & LEAKING DRUM WITH HAZARD PLACARD
# =========================================================================
print("Generating Chemical Drum Textures...")
drum_blue = np.zeros((size, size, 3), dtype=np.uint8)
y_coords = np.arange(size)

# Drum rolling hoops (ribs at y = 256, 512, 768)
drum_h_map = np.ones((size, size), dtype=np.float32) * 128.0
for hoop_y in [220, 480, 740]:
    dist = np.abs(y_coords[:, None] - hoop_y)
    hoop_profile = np.exp(-(dist**2) / 120.0) * 80.0
    drum_h_map += hoop_profile

drum_h_map = np.clip(drum_h_map, 0, 255).astype(np.uint8)

# Standard Industrial Blue Painted Drum
base_blue_r = 18
base_blue_g = 72
base_blue_b = 150
noise_d = np.random.normal(0, 7, (size, size))

db_r = np.clip(base_blue_r + noise_d * 0.4, 0, 255).astype(np.uint8)
db_g = np.clip(base_blue_g + noise_d * 0.7, 0, 255).astype(np.uint8)
db_b = np.clip(base_blue_b + noise_d * 1.0, 0, 255).astype(np.uint8)

drum_img = Image.fromarray(np.stack([db_r, db_g, db_b], axis=2), mode='RGB')
draw_d = ImageDraw.Draw(drum_img)

# White Stencil Bands & Hazmat Warning Placard
draw_d.rectangle([(0, 340), (size, 400)], fill=(235, 235, 240))
draw_d.text((size // 2 - 180, 355), "TOXIC CHEMICAL HAZARD - CLASS 6.1", fill=(20, 20, 20))

# Chimes (Top and bottom metal rims)
draw_d.rectangle([(0, 0), (size, 25)], fill=(120, 125, 135))
draw_d.rectangle([(0, size - 25), (size, size)], fill=(120, 125, 135))

drum_img.save(os.path.join(out_dir, "Tex_ChemicalDrum_Albedo.png"))
normal_from_height(drum_h_map, strength=2.2).save(os.path.join(out_dir, "Tex_ChemicalDrum_Normal.png"))

# Leaking Drum (DRUM-02) with Corrosive Slime, Acid Burns & Rust Crust
drum_leaking = drum_img.copy()
draw_dl = ImageDraw.Draw(drum_leaking)

# Caustic Yellow/Green chemical drip streams running down from bung cap
for dx, w, h in [(380, 35, 600), (450, 50, 750), (530, 40, 680), (620, 25, 450), (310, 20, 380)]:
    # Corrosive acid stain
    draw_dl.polygon([(dx, 0), (dx + w, 0), (dx + w * 0.7, h), (dx + w * 0.3, h)], fill=(185, 220, 25))
    # Burnt chemical crust edge
    draw_dl.line([(dx, 0), (dx + w * 0.3, h)], fill=(75, 45, 10), width=3)
    draw_dl.line([(dx + w, 0), (dx + w * 0.7, h)], fill=(75, 45, 10), width=3)

# Corroded rust patch around bung area
for _ in range(80):
    rx = np.random.randint(340, 580)
    ry = np.random.randint(10, 320)
    rr = np.random.randint(6, 28)
    draw_dl.ellipse([(rx - rr, ry - rr), (rx + rr, ry + rr)], fill=(np.random.randint(140, 190), np.random.randint(60, 100), 20))

drum_leaking = drum_leaking.filter(ImageFilter.SMOOTH)
drum_leaking.save(os.path.join(out_dir, "Tex_ChemicalDrum_Leaking_Albedo.png"))

# =========================================================================
# 4. BRUSHED STAINLESS STEEL (PPE Workbench & Decon Arch)
# =========================================================================
print("Generating Brushed Stainless Steel Textures...")
# Directional horizontal brushed grain
steel_lines = np.random.normal(190, 15, (size, size // 8))
steel_img = Image.fromarray(np.clip(steel_lines, 0, 255).astype(np.uint8)).resize((size, size), Image.Resampling.BILINEAR)
steel_arr = np.array(steel_img)

steel_rgb = np.stack([
    np.clip(steel_arr * 0.98 + 4, 0, 255).astype(np.uint8),
    np.clip(steel_arr * 1.00 + 2, 0, 255).astype(np.uint8),
    np.clip(steel_arr * 1.04 + 6, 0, 255).astype(np.uint8)
], axis=2)

Image.fromarray(steel_rgb, mode='RGB').save(os.path.join(out_dir, "Tex_BrushedSteel_Albedo.png"))
normal_from_height(steel_arr, strength=1.5).save(os.path.join(out_dir, "Tex_BrushedSteel_Normal.png"))

# =========================================================================
# 5. SAFETY YELLOW & BLACK HAZARD CHEVRON STRIPE
# =========================================================================
print("Generating Safety Hazard Chevron Textures...")
stripe_img = Image.new("RGB", (size, size), color=(245, 195, 15))
draw_s = ImageDraw.Draw(stripe_img)

# 45-degree diagonal black bands (width = 80px, spacing = 160px)
band_w = 80
for offset in range(-size, size * 2, band_w * 2):
    poly = [
        (offset, 0),
        (offset + band_w, 0),
        (offset + band_w + size, size),
        (offset + size, size)
    ]
    draw_s.polygon(poly, fill=(28, 28, 30))

# Distressed edge wear & scuffs
for _ in range(50):
    sx = np.random.randint(0, size)
    sy = np.random.randint(0, size)
    sr = np.random.randint(4, 18)
    draw_s.ellipse([(sx - sr, sy - sr), (sx + sr, sy + sr)], fill=(120, 115, 100))

stripe_img = stripe_img.filter(ImageFilter.SMOOTH)
stripe_img.save(os.path.join(out_dir, "Tex_HazardChevron_Albedo.png"))

# =========================================================================
# 6. HEAVY-DUTY INDUSTRIAL PALLET RACK STEEL (Blue Uprights & Orange Beams)
# =========================================================================
print("Generating Pallet Rack Steel Textures...")
# Blue Rack Upright
rack_blue = Image.new("RGB", (512, 1024), color=(20, 85, 175))
draw_rb = ImageDraw.Draw(rack_blue)
# Stamped teardrop slots every 64px vertically
for sy in range(32, 1024, 64):
    for sx in [120, 392]:
        draw_rb.rounded_rectangle([(sx - 15, sy - 20), (sx + 15, sy + 20)], radius=10, fill=(35, 38, 45), outline=(15, 60, 130))

rack_blue.save(os.path.join(out_dir, "Tex_RackSteel_Blue_Albedo.png"))

# Orange Rack Load Beam
rack_orange = Image.new("RGB", (1024, 256), color=(235, 105, 15))
draw_ro = ImageDraw.Draw(rack_orange)
# Rivets / locking pins at ends
for bx in [40, 984]:
    draw_ro.ellipse([(bx - 12, 60), (bx + 12, 84)], fill=(180, 185, 195), outline=(80, 30, 5))
    draw_ro.ellipse([(bx - 12, 172), (bx + 12, 196)], fill=(180, 185, 195), outline=(80, 30, 5))

rack_orange.save(os.path.join(out_dir, "Tex_RackSteel_Orange_Albedo.png"))

# =========================================================================
# 7. WOODEN PALLET PLANKS
# =========================================================================
print("Generating Wood Pallet Textures...")
wood_base = np.random.normal(160, 14, (size, size))
# Longitudinal grain lines
wood_lines = np.random.normal(0, 18, (size, size // 16))
w_img = Image.fromarray(np.clip(wood_lines + 128, 0, 255).astype(np.uint8)).resize((size, size), Image.Resampling.BILINEAR)
w_arr = np.array(w_img).astype(np.float32) - 128.0

wood_val = np.clip(wood_base + w_arr * 0.8, 60, 240)
wood_r = np.clip(wood_val * 1.15 + 25, 0, 255).astype(np.uint8)
wood_g = np.clip(wood_val * 0.95 + 10, 0, 255).astype(np.uint8)
wood_b = np.clip(wood_val * 0.70, 0, 255).astype(np.uint8)

pallet_img = Image.fromarray(np.stack([wood_r, wood_g, wood_b], axis=2), mode='RGB')
draw_p = ImageDraw.Draw(pallet_img)

# Individual plank gaps (every 170px)
for py in range(170, size, 170):
    draw_p.line([(0, py), (size, py)], fill=(45, 30, 15), width=6)
    # Nail heads along planks
    for px in [60, 512, 964]:
        draw_p.ellipse([(px - 4, py - 25), (px + 4, py - 17)], fill=(80, 85, 90), outline=(30, 25, 20))
        draw_p.ellipse([(px - 4, py + 17), (px + 4, py + 25)], fill=(80, 85, 90), outline=(30, 25, 20))

pallet_img.save(os.path.join(out_dir, "Tex_WoodPallet_Albedo.png"))
normal_from_height(np.array(pallet_img.convert('L')), strength=2.0).save(os.path.join(out_dir, "Tex_WoodPallet_Normal.png"))

# =========================================================================
# 8. ROLL-UP DOOR CORRUGATED SHUTTER
# =========================================================================
print("Generating Roll-Up Shutter Textures...")
shutter_img = Image.new("RGB", (size, size), color=(150, 155, 165))
draw_sh = ImageDraw.Draw(shutter_img)

# Horizontal roll-up slats every 40px
h_shutter = np.zeros((size, size), dtype=np.uint8)
for sy in range(0, size, 40):
    draw_sh.rectangle([(0, sy), (size, sy + 36)], fill=(170, 175, 185))
    draw_sh.line([(0, sy + 38), (size, sy + 38)], fill=(50, 52, 58), width=3)
    draw_sh.line([(0, sy), (size, sy)], fill=(220, 225, 235), width=2)
    h_shutter[sy:sy + 36, :] = 180
    h_shutter[sy + 36:sy + 40, :] = 30

shutter_img.save(os.path.join(out_dir, "Tex_RollUpShutter_Albedo.png"))
normal_from_height(h_shutter, strength=2.8).save(os.path.join(out_dir, "Tex_RollUpShutter_Normal.png"))

# =========================================================================
# 9. INDUSTRIAL COLOR-CODED PIPES (Chlorine, Nitrogen, Water)
# =========================================================================
print("Generating Industrial Pipe Textures...")
def make_pipe_tex(color_rgb, label_text, filename):
    p_img = Image.new("RGB", (1024, 256), color=color_rgb)
    p_draw = ImageDraw.Draw(p_img)
    # Metal specular highlight band along center
    p_draw.rectangle([(0, 80), (1024, 140)], fill=tuple([min(255, c + 45) for c in color_rgb]))
    # Directional flow chevron arrows & spec text
    for fx in range(120, 1024, 300):
        # Chevron arrow
        p_draw.polygon([(fx, 100), (fx + 40, 128), (fx, 156), (fx - 15, 156), (fx + 25, 128), (fx - 15, 100)], fill=(20, 20, 20))
        p_draw.text((fx + 55, 118), label_text, fill=(20, 20, 20))
    p_img.save(os.path.join(out_dir, filename))

make_pipe_tex((240, 195, 15), "CHLORINE GAS - TOXIC", "Tex_Pipe_Chlorine_Albedo.png")
make_pipe_tex((205, 35, 25), "PRESSURIZED NITROGEN", "Tex_Pipe_Nitrogen_Albedo.png")
make_pipe_tex((35, 155, 65), "POTABLE WATER DELUGE", "Tex_Pipe_Water_Albedo.png")

print("All impressive PBR textures generated successfully!")
