import os

def create_urp_particle_mat(mat_path, mat_name, tex_guid, color=(0.4, 0.4, 0.42, 0.7), blend_mode=0, soft_fade=1.5):
    r, g, b, a = color
    dst_blend = 10 if blend_mode == 0 else 1
    src_blend = 5 if blend_mode == 0 else 1
    
    mat_content = f"""%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!21 &2100000
Material:
  serializedVersion: 8
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_Name: {mat_name}
  m_Shader: {{fileID: 4800000, guid: 0406db5a14f94604a8c57ccfbc9f3b46, type: 3}}
  m_Parent: {{fileID: 0}}
  m_ModifiedSerializedProperties: 0
  m_ValidKeywords:
  - _SURFACE_TYPE_TRANSPARENT
  m_InvalidKeywords: []
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 0
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: 3000
  stringTagMap:
    RenderType: Transparent
  disabledShaderPasses:
  - DepthOnly
  - SHADOWCASTER
  m_LockedProperties: 
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs:
    - _BaseMap:
        m_Texture: {{fileID: 2800000, guid: {tex_guid}, type: 3}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _BumpMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _EmissionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    m_Ints: []
    m_Floats:
    - _AlphaClip: 0
    - _AlphaToMask: 0
    - _Blend: {blend_mode}
    - _BlendOp: 0
    - _CameraFadingEnabled: 0
    - _CameraFarFadeDistance: 2
    - _CameraNearFadeDistance: 1
    - _ColorMode: 0
    - _Cull: 2
    - _Cutoff: 0.5
    - _DistortionBlend: 0.5
    - _DistortionEnabled: 0
    - _DistortionStrength: 1
    - _DistortionStrengthScaled: 0.1
    - _DstBlend: {dst_blend}
    - _DstBlendAlpha: {dst_blend}
    - _FlipbookBlending: 0
    - _FlipbookMode: 0
    - _Mode: 0
    - _QueueOffset: 0
    - _SoftParticlesEnabled: 1
    - _SoftParticlesFarFadeDistance: {soft_fade}
    - _SoftParticlesNearFadeDistance: 0
    - _SrcBlend: {src_blend}
    - _SrcBlendAlpha: 1
    - _Surface: 1
    - _ZWrite: 0
    m_Colors:
    - _BaseColor: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _BaseColorAddSubDiff: {{r: 0, g: 0, b: 0, a: 0}}
    - _CameraFadeParams: {{r: 0, g: Infinity, b: 0, a: 0}}
    - _Color: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _EmissionColor: {{r: 0, g: 0, b: 0, a: 1}}
    - _SoftParticleFadeParams: {{r: 0, g: {soft_fade}, b: 0, a: 0}}
  m_BuildTextureStacks: []
  m_AllowLocking: 1
--- !u!114 &690540803846291991
MonoBehaviour:
  m_ObjectHideFlags: 11
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: 0}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: d0353a89b1f911e48b9e16bdc9f2e058, type: 3}}
  m_Name: 
  m_EditorClassIdentifier: Unity.RenderPipelines.Universal.Editor::UnityEditor.Rendering.Universal.AssetVersion
  version: 10
"""
    with open(mat_path, 'w', encoding='utf-8') as f:
        f.write(mat_content)
    print(f"Created/Updated Particle Material: {mat_path}")

# GUIDs
guid_smoke_puff = "c904f5c1f19e8fc42865cf6d70b4fcb6" # SmokePuff.png
guid_smoke_loop2 = "b5116609fbb1572419c0bb5259f645a6" # SmokeLoop02.tif
guid_smoke_wispy = "b96c69e599825d84e985962673d1679c" # wispySmoke.tif
guid_smoke_steam = "76e25da1cefc7f446bcc43a70fb13a0f" # smokeysteam.tif
guid_smoke_alpha = "a222b3d2c604e1946af11e01d29efdee" # WFX_T_SmokeLoopAlpha.tga
guid_dust_mote = "394e93ce356b57344903a08ff72fcab2" # DustMoteParticle.png

# 1. Rising Volumetric Smoke (Replaces the pink particle plume with realistic rising smoke!)
create_urp_particle_mat("Assets/Mat_URP_Smoke_RisingPlume.mat", "Mat_URP_Smoke_RisingPlume", guid_smoke_puff, color=(0.32, 0.33, 0.36, 0.8), blend_mode=0, soft_fade=2.0)

# 2. Ambient Wispy Drifting Smoke across Warehouse (Replaces wide pink motes with drifting smoke haze)
create_urp_particle_mat("Assets/Mat_URP_Smoke_WispyDrift.mat", "Mat_URP_Smoke_WispyDrift", guid_smoke_wispy, color=(0.42, 0.44, 0.48, 0.55), blend_mode=0, soft_fade=2.5)

# 3. Chemical Toxic Plume Smoke (For leaking drum)
create_urp_particle_mat("Assets/Mat_URP_Smoke_ToxicHazard.mat", "Mat_URP_Smoke_ToxicHazard", guid_smoke_steam, color=(0.75, 0.88, 0.28, 0.75), blend_mode=0, soft_fade=1.8)

# 4. Dense Ceiling Industrial Smoke
create_urp_particle_mat("Assets/Mat_URP_TexturedSmoke_Dark.mat", "Mat_URP_TexturedSmoke_Dark", guid_smoke_loop2, color=(0.20, 0.20, 0.23, 0.85), blend_mode=0, soft_fade=2.0)

# 5. Textured Dust Motes
create_urp_particle_mat("Assets/Mat_URP_DustMotes_Textured.mat", "Mat_URP_DustMotes_Textured", guid_dust_mote, color=(0.95, 0.95, 0.88, 0.7), blend_mode=1, soft_fade=1.0)

print("All particle materials successfully generated with authentic textures!")
