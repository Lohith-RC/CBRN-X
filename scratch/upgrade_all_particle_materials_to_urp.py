import os

def write_urp_particle_mat(mat_path, mat_name, tex_guid, color=(1, 1, 1, 1), blend_mode=0, soft_fade=1.5, emission=(0, 0, 0, 1)):
    r, g, b, a = color
    er, eg, eb, ea = emission
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
    - _EmissionColor: {{r: {er}, g: {eg}, b: {eb}, a: {ea}}}
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
    os.makedirs(os.path.dirname(mat_path), exist_ok=True)
    with open(mat_path, 'w', encoding='utf-8') as f:
        f.write(mat_content)
    print(f"Upgraded Particle Material: {mat_path}")

# GUIDs
g_flame_round = "408718fd5f763de42b12f849570ddf58" # FlameRoundParticleSheet.tif
g_flame_medium = "1b9340725602e9d40a4e86d4b9dfcb78" # MediumFlame01.tif
g_flame_small = "9cb7bb0b99eccab4794a6de5e6593024" # WFX_T_FlamesSmall 4frm.tga
g_sparks = "2c9ba3deede9b844c84fabc9d8b70c33" # SparkParticle.tif
g_small_dots = "0eec08dcc1590d24590bebf95ecbad1f" # WFX_T_SmallDots A8.png
g_smoke_puff = "c904f5c1f19e8fc42865cf6d70b4fcb6" # SmokePuff.png
g_smoke_loop = "b5116609fbb1572419c0bb5259f645a6" # SmokeLoop02.tif
g_smoke_steam = "76e25da1cefc7f446bcc43a70fb13a0f" # smokeysteam.tif
g_smoke_wispy = "b96c69e599825d84e985962673d1679c" # wispySmoke.tif
g_smoke_alpha = "a222b3d2c604e1946af11e01d29efdee" # WFX_T_SmokeLoopAlpha.tga
g_dust_mote = "394e93ce356b57344903a08ff72fcab2" # DustMoteParticle.png
g_water_mist = "9d5aa5ea4e0631a4bb7518c3cb434858" # WaterMistParticle.tif
g_water_splash = "a4948475d3e9a794cad36c380b171ea7" # ImpactSplashParticle.tif
g_water_ripple = "8b12f103a80e77a4286dc286688b0228" # WaterRipplesParticle.tif

# 1. Fire / Flames Materials
write_urp_particle_mat("Assets/EffectExamples/FireExplosionEffects/Materials/FlameRoundYellowParticle.mat", "FlameRoundYellowParticle", g_flame_round, color=(1.0, 0.75, 0.2, 0.95), blend_mode=1, emission=(1.5, 0.8, 0.1, 1))
write_urp_particle_mat("Assets/EffectExamples/FireExplosionEffects/Materials/FlameParticle.mat", "FlameParticle", g_flame_medium, color=(1.0, 0.65, 0.15, 0.95), blend_mode=1, emission=(1.8, 0.7, 0.1, 1))
write_urp_particle_mat("Assets/EffectExamples/FireExplosionEffects/Materials/MediumFlame01.mat", "MediumFlame01", g_flame_medium, color=(1.0, 0.6, 0.1, 0.95), blend_mode=1, emission=(2.0, 0.8, 0.1, 1))
write_urp_particle_mat("Assets/EffectExamples/FireExplosionEffects/Materials/EmbersParticle.mat", "EmbersParticle", g_sparks, color=(1.0, 0.5, 0.05, 0.95), blend_mode=1, emission=(2.5, 0.8, 0.1, 1))
write_urp_particle_mat("Assets/EffectExamples/FireExplosionEffects/Materials/DarkDefault.mat", "DarkDefault", g_smoke_puff, color=(0.25, 0.25, 0.28, 0.75), blend_mode=0, soft_fade=2.0)

write_urp_particle_mat("Assets/JMO Assets/WarFX/Desktop/Materials/Fire/WFX_M_FlameSmall 4F Add.mat", "WFX_M_FlameSmall 4F Add", g_flame_small, color=(1.0, 0.7, 0.2, 0.95), blend_mode=1, emission=(1.8, 0.8, 0.1, 1))
write_urp_particle_mat("Assets/JMO Assets/WarFX/Desktop/Materials/Misc/WFX_M_SmallDots Add.mat", "WFX_M_SmallDots Add", g_small_dots, color=(1.0, 0.6, 0.1, 0.95), blend_mode=1, emission=(2.0, 0.9, 0.1, 1))
write_urp_particle_mat("Assets/JMO Assets/WarFX/Desktop/Materials/Smoke/WFX_M_SmokeScroll SoftMult Average.mat", "WFX_M_SmokeScroll SoftMult Average", g_smoke_alpha, color=(0.35, 0.35, 0.38, 0.7), blend_mode=0, soft_fade=2.0)

# 2. Sparks & Electrical Materials
write_urp_particle_mat("Assets/EffectExamples/Misc Effects/Materials/Spark2Particle.mat", "Spark2Particle", g_sparks, color=(0.95, 0.98, 1.0, 0.98), blend_mode=1, emission=(2.5, 2.5, 3.0, 1))
write_urp_particle_mat("Assets/EffectExamples/Misc Effects/Materials/SparkParticle.mat", "SparkParticle", g_sparks, color=(1.0, 0.9, 0.6, 0.95), blend_mode=1, emission=(3.0, 2.2, 1.0, 1))
write_urp_particle_mat("Assets/Mat_Fixed_Particle_VFX_ElectricalSparks.mat", "Mat_Fixed_Particle_VFX_ElectricalSparks", g_sparks, color=(0.9, 0.95, 1.0, 0.95), blend_mode=1, emission=(3.0, 3.0, 3.5, 1))
write_urp_particle_mat("Assets/Mat_Fixed_Particle_VFX_Overhead_Conduit_Sparks.mat", "Mat_Fixed_Particle_VFX_Overhead_Conduit_Sparks", g_sparks, color=(1.0, 0.85, 0.4, 0.95), blend_mode=1, emission=(3.0, 2.0, 0.5, 1))

# 3. Smoke, Steam & Fog Materials
write_urp_particle_mat("Assets/EffectExamples/Smoke & Steam Effects/Materials/GroundFog.mat", "GroundFog", g_smoke_loop, color=(0.55, 0.58, 0.62, 0.45), blend_mode=0, soft_fade=2.5)
write_urp_particle_mat("Assets/EffectExamples/Smoke & Steam Effects/Materials/SmokeySteam01.mat", "SmokeySteam01", g_smoke_steam, color=(0.65, 0.70, 0.75, 0.65), blend_mode=0, soft_fade=2.0)
write_urp_particle_mat("Assets/EffectExamples/Smoke & Steam Effects/Materials/SmokeySteam02.mat", "SmokeySteam02", g_smoke_steam, color=(0.75, 0.85, 0.25, 0.75), blend_mode=0, soft_fade=1.8)
write_urp_particle_mat("Assets/EffectExamples/Smoke & Steam Effects/Materials/wispySmoke.mat", "wispySmoke", g_smoke_wispy, color=(0.50, 0.52, 0.55, 0.50), blend_mode=0, soft_fade=2.5)
write_urp_particle_mat("Assets/EffectExamples/Smoke & Steam Effects/Materials/SmokeLightParticle.mat", "SmokeLightParticle", g_smoke_puff, color=(0.35, 0.36, 0.38, 0.75), blend_mode=0, soft_fade=2.0)

# 4. Dust Motes
write_urp_particle_mat("Assets/EffectExamples/Misc Effects/Materials/DustMoteParticle.mat", "DustMoteParticle", g_dust_mote, color=(0.95, 0.95, 0.85, 0.65), blend_mode=1, emission=(1.2, 1.2, 1.0, 1))
write_urp_particle_mat("Assets/Mat_Fixed_Particle_VFX_AmbientDustMotes.mat", "Mat_Fixed_Particle_VFX_AmbientDustMotes", g_dust_mote, color=(0.95, 0.95, 0.85, 0.65), blend_mode=1, emission=(1.2, 1.2, 1.0, 1))

# 5. Water / Decon Shower Materials
write_urp_particle_mat("Assets/EffectExamples/WaterEffects/Materials/WaterMistParticle.mat", "WaterMistParticle", g_water_mist, color=(0.85, 0.92, 1.0, 0.6), blend_mode=0, soft_fade=1.5)
write_urp_particle_mat("Assets/EffectExamples/WaterEffects/Materials/WaterDropSmall.mat", "WaterDropSmall", g_water_mist, color=(0.9, 0.95, 1.0, 0.75), blend_mode=0, soft_fade=1.2)
write_urp_particle_mat("Assets/EffectExamples/WaterEffects/Materials/SplashDrop.mat", "SplashDrop", g_water_splash, color=(0.9, 0.95, 1.0, 0.8), blend_mode=0, soft_fade=1.2)
write_urp_particle_mat("Assets/EffectExamples/WaterEffects/Materials/WaterRipple.mat", "WaterRipple", g_water_ripple, color=(0.85, 0.92, 1.0, 0.5), blend_mode=0, soft_fade=1.0)
write_urp_particle_mat("Assets/Mat_Fixed_Particle_VFX_Decon_Spray_Arch.mat", "Mat_Fixed_Particle_VFX_Decon_Spray_Arch", g_water_mist, color=(0.85, 0.95, 1.0, 0.7), blend_mode=0, soft_fade=1.5)
write_urp_particle_mat("Assets/Mat_Fixed_Particle_VFX_ShowerSpray.mat", "Mat_Fixed_Particle_VFX_ShowerSpray", g_water_mist, color=(0.85, 0.95, 1.0, 0.7), blend_mode=0, soft_fade=1.5)

print("All particle materials upgraded to textured URP Particle Unlit with 100% texture coverage!")
