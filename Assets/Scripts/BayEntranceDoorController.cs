using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// BayEntranceDoorController — Manages the Bay 03 corrugated roll-up shutter and perimeter gates.
    /// Automatically lifts the door upon scenario start or PPE completion, ensuring smooth, unobstructed entry.
    /// </summary>
    public class BayEntranceDoorController : MonoBehaviour
    {
        public static BayEntranceDoorController Instance { get; private set; }

        [Header("Door References")]
        public Transform rollUpShutterPanel;
        public float openHeight = 8.5f;
        public float closedHeight = 3.0f;
        public float doorOpenSpeed = 3.5f;
        public bool isOpen = true; // Open by default for immediate seamless training access

        [Header("Audio")]
        public AudioSource doorAudioSource;
        public AudioClip rollUpDoorMotorClip;

        private float targetY;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            LocateDoorInScene();
        }

        private void Start()
        {
            LocateDoorInScene();
            targetY = isOpen ? openHeight : closedHeight;

            // Ensure the door collider is non-blocking or positioned open immediately
            if (rollUpShutterPanel != null)
            {
                Vector3 pos = rollUpShutterPanel.localPosition;
                pos.y = openHeight;
                rollUpShutterPanel.localPosition = pos;

                Collider col = rollUpShutterPanel.GetComponent<Collider>();
                if (col != null)
                {
                    col.isTrigger = true; // Non-blocking trigger
                }
            }

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
                Collider col = rollUpShutterPanel.GetComponent<Collider>();
                if (col != null)
                {
                    col.isTrigger = true;
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
