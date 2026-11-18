#!/usr/bin/env python3
"""Read ffmpeg loudnorm print_format=json output on stdin and print measured params."""
import json
import sys

text = sys.stdin.read()
data = json.loads(text[text.rfind("{", 0, text.rfind("}")): text.rfind("}") + 1])
print(
    f"measured_I={data['input_i']}:measured_TP={data['input_tp']}:"
    f"measured_LRA={data['input_lra']}:measured_thresh={data['input_thresh']}:"
    f"offset={data['target_offset']}"
)
