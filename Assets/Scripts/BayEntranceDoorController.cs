using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// BayEntranceDoorController V3.0 — Manages Unobstructed Bay 03 Entrance Corridor and Roll-Up Shutters.
    /// Features:
    /// - Runtime clearance of central corridor barricades (ENV_Barricade_X*), gate leaves, and berms
    /// - Automatic lifting of roll-up shutter to y = 8.5m on scenario start / PPE completion
    /// - Converts all corridor barrier colliders to non-blocking triggers so the player can walk freely into Bay 03
    /// </summary>
    public class BayEntranceDoorController : MonoBehaviour
    {
        public static BayEntranceDoorController Instance { get; private set; }

        [Header("Door References")]
        public Transform rollUpShutterPanel;
        public float openHeight = 8.5f;
        public float closedHeight = 3.0f;
        public float doorOpenSpeed = 4.0f;
        public bool isOpen = true;

        [Header("Audio")]
        public AudioSource doorAudioSource;
        public AudioClip rollUpDoorMotorClip;

        private float targetY;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else if (Instance != this) { Destroy(gameObject); return; }

            ClearCorridorObstacles();
            LocateDoorInScene();
        }

        private void Start()
        {
            ClearCorridorObstacles();
            LocateDoorInScene();
            targetY = isOpen ? openHeight : closedHeight;

            OpenDoor();

            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnFullPpeCompletedEvent += OpenDoor;
                GameManager.Instance.OnStageTransition += OnStageTransition;
            }
        }

        private void OnDestroy()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnFullPpeCompletedEvent -= OpenDoor;
                GameManager.Instance.OnStageTransition -= OnStageTransition;
            }
        }

        /// <summary>
        /// Scans and converts all central corridor barricades, gate leaves, hazard stripes, berms, and threshold colliders to non-blocking triggers.
        /// </summary>
        public void ClearCorridorObstacles()
        {
            string[] obstacleKeywords = new string[]
            {
                "threshold",
                "stripe",
                "berm",
                "barricade",
                "hazard_bar",
                "gate_leaf",
                "gate_hazard",
                "floormark",
                "lane_line",
                "trench_drain",
                "drum_zone_border",
                "recessed_basin",
                "recessed_sump",
                "rail_spur",
                "scuff"
            };

            Collider[] allCols = FindObjectsByType<Collider>(FindObjectsInactive.Include);
            int clearedCount = 0;

            foreach (var col in allCols)
            {
                if (col == null || col is CharacterController) continue;

                string goName = col.gameObject.name.ToLower();

                // Do not disable the primary structural room floor planes
                if (goName == "env_floor_bay03" || goName == "env_floor_stagingsafezone" || goName.StartsWith("env_wall_"))
                {
                    continue;
                }

                foreach (var kw in obstacleKeywords)
                {
                    if (goName.Contains(kw))
                    {
                        col.isTrigger = true;
                        col.enabled = false;
                        clearedCount++;
                        break;
                    }
                }
            }

            Debug.Log($"[CBRS-X] Bay 03 Entrance Cleared — {clearedCount} floor stripe/threshold/berm colliders set to trigger/disabled.");
        }

        private void LocateDoorInScene()
        {
            if (rollUpShutterPanel == null)
            {
                GameObject doorGo = GameObject.Find("RollUp_Door_Panel");
                if (doorGo == null) doorGo = GameObject.Find("DOOR_Corrugated_RollUp_Shutter");
                if (doorGo != null)
                {
                    rollUpShutterPanel = doorGo.transform;
                }
            }
        }

        private void OnStageTransition(GameManager.ScenarioStage stage)
        {
            OpenDoor();
        }

        public void OpenDoor()
        {
            isOpen = true;
            targetY = openHeight;

            if (doorAudioSource != null && rollUpDoorMotorClip != null && !doorAudioSource.isPlaying)
            {
                doorAudioSource.PlayOneShot(rollUpDoorMotorClip, 0.75f);
            }

            if (rollUpShutterPanel != null)
            {
                Vector3 pos = rollUpShutterPanel.localPosition;
                pos.y = openHeight;
                rollUpShutterPanel.localPosition = pos;

                Collider[] cols = rollUpShutterPanel.GetComponentsInChildren<Collider>(true);
                foreach (var c in cols)
                {
                    c.isTrigger = true;
                }
            }

            Debug.Log("[CBRS-X] Bay 03 Industrial Roll-Up Shutter OPENED — Hot Zone Entrance Accessible.");
        }

        private void Update()
        {
            if (rollUpShutterPanel == null)
            {
                LocateDoorInScene();
                if (rollUpShutterPanel == null) return;
            }

            Vector3 currentPos = rollUpShutterPanel.localPosition;
            if (Mathf.Abs(currentPos.y - targetY) > 0.01f)
            {
                currentPos.y = Mathf.MoveTowards(currentPos.y, targetY, Time.deltaTime * doorOpenSpeed);
                rollUpShutterPanel.localPosition = currentPos;
            }
        }
    }
}
