"""blender -b design/fluid/tornado-fluid.blend --python tools/check-fluid-loop.py"""
import json
import bpy
from mathutils import Vector

scene = bpy.context.scene
names = ['Cyan current', 'Silver current', 'Pearl current']
def points(frame):
    scene.frame_set(frame)
    deps = bpy.context.evaluated_depsgraph_get()
    return {name:[v.co.copy() for v in bpy.data.objects[name].evaluated_get(deps).data.vertices] for name in names}

start, middle, end = points(1), points(145), points(289)
report = {}
for name in names:
    seam = max((a-b).length for a,b in zip(start[name],end[name]))
    motion = max((a-b).length for a,b in zip(start[name],middle[name]))
    assert seam < 1e-5, f'{name}: open loop ({seam})'
    assert motion > .1, f'{name}: missing deformation'
    report[name] = {'loop_error':seam,'midcycle_displacement':motion}
print(json.dumps(report,indent=2))
