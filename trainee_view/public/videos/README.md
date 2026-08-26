# Trainee Beat Videos — Required Placement

The 9-beat narrative engine (`src/App.jsx`) streams one video per tactical beat
from this directory. These files are large and were historically excluded from
git; the `.gitignore` now allowlists `*.mp4` inside **this folder only**.

## Required files

| File      | Used by beats            |
|-----------|--------------------------|
| `1.mp4`   | BEAT_1 (CCTV breach)     |
| `2.mp4`   | BEAT_2, BEAT_4           |
| `3.mp4`   | BEAT_3                   |
| `5.mp4`   | BEAT_6                   |
| `6.mp4`   | BEAT_5                   |
| `7.mp4`   | BEAT_7                   |
| `8.mp4`   | BEAT_8                   |
| `9.mp4`   | BEAT_9                   |

Place them here before running the trainee view:

```
trainee_view/public/videos/1.mp4 ... 9.mp4
```

Without them the simulator renders with missing media. Obtain the source
recordings from the project maintainers or re-export them from the Unity
project, then commit with:

```powershell
git add trainee_view/public/videos/*.mp4
git commit -m "feat(trainee): add beat simulation videos"
```

Keep individual files under ~25 MB so the repo stays cloneable.
