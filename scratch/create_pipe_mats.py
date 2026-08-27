import os
import hashlib

def get_guid(name):
    h = hashlib.md5(name.encode('utf-8')).hexdigest()
    return h

tex_dir = "Assets/Textures/Generated"

# GUID Lookups
guid_pipe_cl = get_guid("CBRS_TEX_Tex_Pipe_Chlorine_Albedo.png")
guid_pipe_n2 = get_guid("CBRS_TEX_Tex_Pipe_Nitrogen_Albedo.png")
guid_pipe_h2o = get_guid("CBRS_TEX_Tex_Pipe_Water_Albedo.png")

from setup_impressive_materials import create_urp_lit_mat

create_urp_lit_mat("Assets/Mat_Pipe_Chlorine.mat", "Mat_Pipe_Chlorine", guid_pipe_cl, None, tiling=(1, 4), smoothness=0.65, metallic=0.75)
create_urp_lit_mat("Assets/Mat_Pipe_Nitrogen.mat", "Mat_Pipe_Nitrogen", guid_pipe_n2, None, tiling=(1, 4), smoothness=0.65, metallic=0.75)
create_urp_lit_mat("Assets/Mat_Pipe_Water.mat", "Mat_Pipe_Water", guid_pipe_h2o, None, tiling=(1, 4), smoothness=0.65, metallic=0.75)

print("Pipe materials created successfully!")
