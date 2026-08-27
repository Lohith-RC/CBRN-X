import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = "Assets/Textures/Generated"
os.makedirs(out_dir, exist_ok=True)

size = 1024
center = size // 2

# =========================================================================
# 1. INDUSTRIAL WIRE-GUARD CAGE SPOTLIGHT COOKIE
# =========================================================================
print("Generating Industrial Wire-Guard Light Cookie...")
cage_img = Image.new("L", (size, size), color=0)
draw_cage = ImageDraw.Draw(cage_img)

# Main circular spotlight aperture with smooth soft falloff
y_grid, x_grid = np.ogrid[:size, :size]
dist = np.sqrt((x_grid - center)**2 + (y_grid - center)**2)
radius = size * 0.44

# Smooth radial spotlight aperture
spot_mask = np.clip(1.0 - (dist / radius)**2.5, 0, 1.0)
cage_arr = (spot_mask * 255).astype(np.uint8)
cage_img = Image.fromarray(cage_arr, mode='L')
draw_cage = ImageDraw.Draw(cage_img)

# Concentric wire rings
for r_ring in [120, 240, 360, 440]:
    draw_cage.ellipse([(center - r_ring, center - r_ring), (center + r_ring, center + r_ring)], fill=None, outline=20, width=14)

# Crosshatch wire struts (8-way radial spoke cage)
for angle_deg in range(0, 180, 45):
    rad = math.radians(angle_deg)
    x1 = int(center - radius * math.cos(rad))
    y1 = int(center - radius * math.sin(rad))
    x2 = int(center + radius * math.cos(rad))
    y2 = int(center + radius * math.sin(rad))
    draw_cage.line([(x1, y1), (x2, y2)], fill=20, width=16)

cage_img = cage_img.filter(ImageFilter.GaussianBlur(radius=4))
cage_img.save(os.path.join(out_dir, "Tex_LightCookie_IndustrialCage.png"))

# =========================================================================
# 2. HIGH-BAY LOUVERED INDUSTRIAL SLAT LIGHT COOKIE
# =========================================================================
print("Generating High-Bay Louvered Slat Light Cookie...")
louver_img = Image.new("L", (size, size), color=0)
draw_louv = ImageDraw.Draw(louver_img)

# Rectangular high-bay luminaire beam falloff
rect_mask = np.clip(1.0 - ((np.abs(x_grid - center) / (size * 0.42))**3 + (np.abs(y_grid - center) / (size * 0.42))**3), 0, 1.0)
louv_arr = (rect_mask * 255).astype(np.uint8)
louver_img = Image.fromarray(louv_arr, mode='L')
draw_louv = ImageDraw.Draw(louver_img)

# Horizontal louver shadows
for ly in range(120, 920, 80):
    draw_louv.line([(80, ly), (944, ly)], fill=25, width=18)

# Center divider spine
draw_louv.line([(center, 80), (center, 944)], fill=25, width=22)

louver_img = louver_img.filter(ImageFilter.GaussianBlur(radius=5))
louver_img.save(os.path.join(out_dir, "Tex_LightCookie_LouverSlats.png"))

# =========================================================================
# 3. INDUSTRIAL EXHAUST FAN / LOUVER LIGHT COOKIE
# =========================================================================
print("Generating Industrial Exhaust Fan Light Cookie...")
fan_img = Image.new("L", (size, size), color=0)
fan_arr = (spot_mask * 255).astype(np.uint8)
fan_img = Image.fromarray(fan_arr, mode='L')
draw_fan = ImageDraw.Draw(fan_img)

# 4 Fan Blades casting geometric shadows
for blade_angle in range(0, 360, 90):
    b_rad = math.radians(blade_angle)
    # Fan hub center circle
    draw_fan.ellipse([(center - 90, center - 90), (center + 90, center + 90)], fill=15)
    # Blade polygon
    bx1 = center + int(70 * math.cos(b_rad - 0.2))
    by1 = center + int(70 * math.sin(b_rad - 0.2))
    bx2 = center + int(420 * math.cos(b_rad - 0.4))
    by2 = center + int(420 * math.sin(b_rad - 0.4))
    bx3 = center + int(440 * math.cos(b_rad + 0.3))
    by3 = center + int(440 * math.sin(b_rad + 0.3))
    bx4 = center + int(70 * math.cos(b_rad + 0.2))
    by4 = center + int(70 * math.sin(b_rad + 0.2))
    draw_fan.polygon([(bx1, by1), (bx2, by2), (bx3, by3), (bx4, by4)], fill=20)

fan_img = fan_img.filter(ImageFilter.GaussianBlur(radius=6))
fan_img.save(os.path.join(out_dir, "Tex_LightCookie_VentFan.png"))

# =========================================================================
# 4. VOLUMETRIC LIGHT CONE SHAFT TEXTURE (God Rays / Light Drums)
# =========================================================================
print("Generating Volumetric Light Shaft Beam Texture...")
beam_h = 1024
beam_w = 512
y_coords = np.arange(beam_h)
x_coords = np.arange(beam_w)

# Longitudinal dust streaks & vertical attenuation
dust_noise = np.random.normal(128, 25, (beam_h // 16, beam_w))
dust_img = Image.fromarray(np.clip(dust_noise, 0, 255).astype(np.uint8)).resize((beam_w, beam_h), Image.Resampling.BICUBIC)
dust_arr = np.array(dust_img).astype(np.float32) / 255.0

# Horizontal Gaussian cone falloff
center_x = beam_w / 2.0
x_dist = np.abs(x_coords[None, :] - center_x)
horiz_falloff = np.exp(-(x_dist**2) / (2.0 * (beam_w * 0.32)**2))

# Vertical falloff (brightest at top luminaire source, softly fading toward floor)
vert_falloff = np.clip(1.0 - (y_coords[:, None] / beam_h)**1.2, 0.05, 1.0)

beam_val = (horiz_falloff * vert_falloff * (0.8 + dust_arr * 0.4) * 255).astype(np.uint8)
beam_img = Image.fromarray(beam_val, mode='L')
beam_img.save(os.path.join(out_dir, "Tex_VolumetricLight_Shaft.png"))

print("All lighting cookie and volumetric textures generated successfully!")
