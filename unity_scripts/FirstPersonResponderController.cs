using UnityEngine;

namespace CBRSX.Unity
{
    [RequireComponent(typeof(CharacterController))]
    public class FirstPersonResponderController : MonoBehaviour
    {
        [Header("Movement Settings")]
        public float moveSpeed = 4.5f;
        public float mouseSensitivity = 2.0f;
        public float gravity = -9.81f;

        [Header("Protocol State")]
        public bool hasFullPpe = false;
        public bool inHazardZone = false;

        private CharacterController characterController;
        private Camera playerCamera;
        private float verticalRotation = 0f;
        private Vector3 velocity;

        private void Start()
        {
            characterController = GetComponent<CharacterController>();
            playerCamera = GetComponentInChildren<Camera>();
            
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void Update()
        {
            HandleMouseLook();
            HandleMovement();
        }

        private void HandleMouseLook()
        {
            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

            verticalRotation -= mouseY;
            verticalRotation = Mathf.Clamp(verticalRotation, -80f, 80f);

            if (playerCamera != null)
            {
                playerCamera.transform.localRotation = Quaternion.Euler(verticalRotation, 0f, 0f);
            }
            transform.Rotate(Vector3.up * mouseX);
        }

        private void HandleMovement()
        {
            float moveX = Input.GetAxis("Horizontal");
            float moveZ = Input.GetAxis("Vertical");

            Vector3 move = transform.right * moveX + transform.forward * moveZ;
            characterController.Move(move * moveSpeed * Time.deltaTime);

            if (characterController.isGrounded && velocity.y < 0)
            {
                velocity.y = -2f;
            }
            velocity.y += gravity * Time.deltaTime;
            characterController.Move(velocity * Time.deltaTime);
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("HazardZone"))
            {
                inHazardZone = true;
                if (!hasFullPpe)
                {
                    Debug.LogWarning("[PROTOCOL VIOLATION] Entered hazard zone without PPE!");
                    if (CbrsEventLogger.Instance != null)
                    {
                        CbrsEventLogger.Instance.LogEvent("entered_hazard_zone_without_ppe", "{\"warning\":\"Entered chemical cloud without PPE\"}");
                    }
                }
            }
        }
    }
}
