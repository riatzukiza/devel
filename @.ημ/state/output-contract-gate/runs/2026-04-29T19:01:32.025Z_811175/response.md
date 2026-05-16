## Signal
(世, p=0.96) Confirmed: this is an NVIDIA driver/library mismatch, not the GPU disappearing.

Current state:

```text
nvidia-smi:
Failed to initialize NVML: Driver/library version mismatch
NVML library version: 580.142
```

Loaded kernel module:

```text
NVRM version: NVIDIA UNIX x86_64 Kernel Module 580.126.09
```

Installed module/userspace:

```text
modinfo nvidia -> version: 580.142
libnvidia-ml.so -> 580.142
```

(世, p=0.95) Diagnosis: userspace NVIDIA libraries upgraded to `580.142`, but the currently loaded kernel module is still `580.126.09`. This normally happens after an NVIDIA driver update before reboot. The fix is a reboot so the kernel loads the new `580.142` module.

## Evidence
(己, p=0.95) I checked:

- `/proc/driver/nvidia/version` → loaded kernel module is `580.126.09`
- `modinfo nvidia` → installed module on disk is `580.142`
- `ldconfig` → NVML userspace library is `580.142`
- `lspci` still sees the GPU:

```text
NVIDIA Corporation AD106M [GeForce RTX 4070 Max-Q / Mobile]
Kernel driver in use: nvidia
```

(己, p=0.8) `llamacpp-embed` is still running and recently answered `/v1/embeddings 200`, but host NVIDIA management tooling is broken until the module/userspace versions match again.

## Frames
(世, p=0.9) This is probably not a hardware disappearance.
(世, p=0.85) This is probably not caused by OpenPlanner/Proxx directly.
(世, p=0.9) This is the classic “driver package updated; old NVIDIA kernel module still loaded” state.

## Countermoves
(世, p=0.9) Do **not** try random `modprobe -r nvidia` while the desktop/containers may be using it; that can wedge graphics or kill active GPU workloads.
(世, p=0.85) A module reload without reboot would require stopping GPU containers and likely the display stack. Since this is a desktop/workstation, reboot is safer.
(世, p=0.75) The optional Vexx failure seen earlier is separate; this NVML mismatch is host driver state.

## Next
(汝, p=0.95) Reboot the machine; after it comes back, run `nvidia-smi` again and it should report driver `580.142` cleanly.