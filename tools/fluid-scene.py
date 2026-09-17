"""Original Tomado Fluid brand film. Blender 4.3+; no external assets.

blender -b --python tools/fluid-scene.py -- --out WORK --preview
blender -b --python tools/fluid-scene.py -- --out WORK --render
The saved .blend includes looping shape keys, packed lighting and both cameras.
"""
import argparse
import math
import os
import sys
import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--out', required=True)
parser.add_argument('--preview', action='store_true')
parser.add_argument('--preview-scale', type=int, default=65)
parser.add_argument('--render', action='store_true')
parser.add_argument('--mobile', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
os.makedirs(args.out, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 1440
scene.render.resolution_y = 810
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 288
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.film_transparent = False

# A packed, original studio environment: long luminous cards, cyan bounce,
# narrow dark dividers. Reflection comes from geometry, not a video texture.
import numpy as np
w, h = 1024, 512
u, v = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
rgb = np.ones((h, w, 3), dtype=np.float32) * np.array([0.12, 0.20, 0.23])
for center, width, strength, color in [
    (.14, .042, 4.0, (1, 1, 1)), (.36, .075, 2.2, (.76, .92, 1)),
    (.62, .027, 5.0, (1, 1, 1)), (.83, .10, 1.6, (.9, 1, 1)),
]:
    band = np.exp(-((u-center)/width)**8) * (.25+.75*np.sin(v*math.pi)**2)
    rgb += band[:, :, None] * strength * np.array(color)
for center in [.25, .52, .72, .95]:
    band = np.exp(-((u-center)/.033)**8)
    rgb *= (1-.88*band[:, :, None])
rgba = np.concatenate([rgb, np.ones((h, w, 1))], axis=2)
env = bpy.data.images.new('Original studio reflection cards', width=w, height=h, float_buffer=True)
env.pixels.foreach_set(rgba.astype(np.float32).ravel())
env.pack()
world = bpy.data.worlds.new('Silver cyan studio')
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wn.clear()
texture = wn.new('ShaderNodeTexEnvironment')
texture.image = env
background = wn.new('ShaderNodeBackground')
world.node_tree.links.new(texture.outputs['Color'], background.inputs['Color'])
output = wn.new('ShaderNodeOutputWorld')
world.node_tree.links.new(background.outputs[0], output.inputs[0])

def material(name, color, metal, roughness, transmission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Transmission Weight'].default_value = transmission
    bsdf.inputs['IOR'].default_value = 1.46
    bsdf.inputs['Coat Weight'].default_value = .42
    bsdf.inputs['Coat Roughness'].default_value = .08
    return m

silver = material('Liquid silver', (.67, .79, .82), .98, .085)
cyan = material('Pale cyan optical surface', (.16, .40, .46), .9, .095, .08)
pearl = material('Pearlescent silver', (.81, .9, .91), .94, .11)

# Broad, closed, elliptical ribbon sections. The time-dependent offsets use
# integer harmonics so frame 289 equals frame 1 exactly (12 seconds at 24 fps).
N, K = 192, 24
def vertices(index, phase):
    verts = []
    for j in range(N + 1):
        t = 1.2 * j / N
        x = -10.5 + 18.3*t
        y = -5.50 + 13.2*t**4 + index*.63
        x += .22*math.sin(2*math.pi*t + phase + index*.7)*t
        y += .23*math.sin(2*math.pi*t + phase + index*.7)
        z = .55*math.sin(t*math.pi*3 + index*.45) + index*1.7
        dx, dy = 18.3, 52.8*t**3
        length = math.hypot(dx, dy)
        nx, ny = -dy/length, dx/length
        twist = .9*math.sin(t*math.pi*3.2 + index*.6) + .20*math.sin(phase+t*math.pi*2)
        width = [1.10, .60, .78][index] * (.85+.20*math.sin(t*math.pi))
        for k in range(K):
            a = 2*math.pi*k/K
            across = width*math.cos(a)
            depth = .09*math.sin(a)
            broad = across*math.cos(twist) - depth*math.sin(twist)
            height = across*math.sin(twist) + depth*math.cos(twist)
            height += .16*math.sin(t*math.pi*7+across*1.8+phase)*math.cos(a)**2
            verts.append((x+nx*broad, y+ny*broad, z+height))
    return verts

for index, mat in enumerate([cyan, silver, pearl]):
    faces = []
    for j in range(N):
        for k in range(K):
            a, b = j*K+k, j*K+(k+1)%K
            faces.append((a,b,b+K,a+K))
    faces.extend([tuple(range(K-1,-1,-1)), tuple(N*K+k for k in range(K))])
    mesh = bpy.data.meshes.new('Continuous ribbon surface')
    mesh.from_pydata(vertices(index,0), [], faces)
    mesh.update()
    obj = bpy.data.objects.new(['Cyan current','Silver current','Pearl current'][index],mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for poly in mesh.polygons: poly.use_smooth = True
    obj.shape_key_add(name='Basis')
    # Absolute shape keys are embedded in the .blend and play without scripts.
    obj.data.shape_keys.use_relative = False
    for step in range(1,25):
        key = obj.shape_key_add(name=f'Loop {step:02d}')
        for point, co in zip(key.data, vertices(index,step/24*2*math.pi)):
            point.co = co
        key.interpolation = 'KEY_LINEAR'
    keys = obj.data.shape_keys
    keys.eval_time = 0
    keys.keyframe_insert(data_path='eval_time', frame=1)
    keys.eval_time = 240
    keys.keyframe_insert(data_path='eval_time', frame=289)
    for curve in keys.animation_data.action.fcurves:
        for point in curve.keyframe_points: point.interpolation = 'LINEAR'

# Clean background with gentle studio gradient, independent of lighting.
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-3))
back = bpy.context.object
back.name = 'Silver white seamless backdrop'
mat = bpy.data.materials.new('Quiet background')
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes.clear()
em = nodes.new('ShaderNodeEmission')
em.inputs[0].default_value = (.79,.86,.87,1)
em.inputs[1].default_value = 1.8
out = nodes.new('ShaderNodeOutputMaterial')
mat.node_tree.links.new(em.outputs[0],out.inputs[0])
back.data.materials.append(mat)

def area(name, location, power, size, color):
    data = bpy.data.lights.new(name,'AREA')
    data.energy, data.shape, data.size, data.color = power,'DISK',size,color
    obj = bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((2,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()

area('Large softbox',(-3,1,8),650,8,(.85,.95,1))
area('Long edge highlight',(6,4,6),850,5,(1,1,1))

def camera(name, position, scale):
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location = position
    data.type = 'ORTHO'
    data.ortho_scale = scale
    return obj

desktop = camera('Desktop composition',(0,0,18),16)
mobile = camera('Portrait composition',(3,2.0,18),16)
scene.camera = mobile if args.mobile else desktop
if args.mobile:
    scene.render.resolution_x, scene.render.resolution_y = 720,1280
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(args.out,'tornado-fluid.blend'))
if args.preview:
    scene.render.resolution_percentage = args.preview_scale
    scene.render.filepath = os.path.join(args.out,'preview-mobile.png' if args.mobile else 'preview.png')
    bpy.ops.render.render(write_still=True)
if args.render:
    folder = os.path.join(args.out,'mobile' if args.mobile else 'desktop')
    os.makedirs(folder,exist_ok=True)
    scene.render.filepath = os.path.join(folder,'frame-')
    bpy.ops.render.render(animation=True)
