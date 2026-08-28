using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// FirstPersonResponderController V3.1 — Fluid First-Person Locomotion and Tool Controller.
    /// Features:
    /// - Always-fluid 60FPS mouse look and kinematics (auto-relock on click)
    /// - 6-DOF Procedural Camera Kinematics (Sway, Head Bob, Strafe Roll)
    /// - Full equipment hotkey integration (1/G for Spectrometer, 2 for Containment Kit, E for Interact)
    /// - Safe CharacterController collision settings to prevent sticking on doorways and floor seams
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class FirstPersonResponderController : MonoBehaviour
    {
        [Header("Tactical Locomotion Kinematics")]
        public float walkSpeed = 4.2f;
        public float sprintSpeed = 6.8f;
        public float crouchSpeed = 2.2f;
        public float acceleration = 16.0f;
        public float deceleration = 20.0f;
        public float mouseSensitivity = 2.4f;
        public float gravity = -18.5f;
        public float jumpHeight = 1.35f;
        public float coyoteTime = 0.2f;
        public float jumpBufferTime = 0.15f;

        [Header("Crouch Configuration")]
        public float standingHeight = 1.8f;
        public float crouchHeight = 1.0f;
        public float crouchTransitionSpeed = 8.0f;
        private bool isCrouching = false;
        private float currentHeight;

        [Header("Camera Kinematics & Spring Sway")]
        public float strafeRollAngle = 2.0f;
        public float rollSmoothing = 6.0f;
        public float bobFrequency = 2.0f;
        public float bobHorizontalAmplitude = 0.015f;
        public float bobVerticalAmplitude = 0.025f;
        public float sprintBobMultiplier = 1.35f;
        public float landingCompressionDistance = 0.08f;
        public float springRecoverySpeed = 10.0f;

        [Header("Sprint FOV")]
        public float defaultFov = 75f;
        public float sprintFov = 82f;
        public float fovTransitionSpeed = 6.0f;

        [Header("Trauma-Based 6-DOF Screen Shake")]
        [Range(0f, 1f)] public float trauma = 0f;
        public float traumaDecayRate = 1.2f;
        public float maxShakeTranslation = 0.15f;
        public float maxShakeRotation = 6.0f;
        public float shakeFrequency = 25.0f;

        [Header("Acoustic & Respirator Environment")]
        public AudioSource respiratorBreathingSource;
        public AudioLowPassFilter masterAudioLowPass;
        public float unequippedCutoff = 22000f;
        public float equippedRespiratorCutoff = 850f;

        [Header("Visor Condensation Driver")]
        [Range(0f, 1f)] public float visorFogLevel = 0f;
        public float breathingCycleDuration = 4.0f;

        [Header("Ground Detection")]
        public float groundCheckDistance = 0.35f;
        public LayerMask groundCheckMask = ~0;

        public static FirstPersonResponderController Instance { get; private set; }

        [Header("Protocol State")]
        public bool hasFullPpe = false;
        public bool inHazardZone = false;

        // Internal Kinematics State
        private CharacterController characterController;
        private Camera playerCamera;
        private float verticalRotation = 0f;
        private Vector3 currentVelocity;
        private Vector3 targetMoveVector;
        private Vector3 currentMoveVector;
        private float currentRollAngle = 0f;
        private float bobTimer = 0f;
        private float defaultCameraY = 1.65f;
        private float crouchCameraY = 1.25f;
        private float landingOffset = 0f;
        private bool wasGroundedLastFrame = true;
        private bool cursorLocked = true;
        private float breathingTimer = 0f;
        private float coyoteTimer = 0f;
        private float jumpBufferTimer = 0f;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else if (Instance != this)
            {
                // In case of duplicate or inactive responder, prioritize active one
                if (gameObject.activeInHierarchy)
                {
                    Instance = this;
                }
            }

            characterController = GetComponent<CharacterController>();
            playerCamera = GetComponentInChildren<Camera>();

            if (characterController != null)
            {
                characterController.stepOffset = 0.5f;
                characterController.slopeLimit = 60f;
                characterController.minMoveDistance = 0f;
                characterController.skinWidth = 0.03f;
                characterController.radius = 0.3f;
            }

            if (playerCamera == null)
            {
                playerCamera = Camera.main;
            }

            if (playerCamera != null)
            {
                defaultCameraY = playerCamera.transform.localPosition.y;
                if (defaultCameraY < 1.0f) defaultCameraY = 1.65f;
                crouchCameraY = defaultCameraY - (standingHeight - crouchHeight) * 0.5f;
            }

            // Strip any rogue child colliders that could collide with CharacterController
            StripAllChildColliders();
        }

        public void StripAllChildColliders()
        {
            Collider[] childCols = GetComponentsInChildren<Collider>(true);
            foreach (var col in childCols)
            {
                // Don't disable the CharacterController component itself
                if (col is CharacterController) continue;

                col.enabled = false;
                if (Application.isPlaying)
                {
                    Destroy(col);
                }
            }

            Rigidbody[] childRbs = GetComponentsInChildren<Rigidbody>(true);
            foreach (var rb in childRbs)
            {
                rb.isKinematic = true;
                rb.detectCollisions = false;
            }
        }

        private void Start()
        {
            currentHeight = standingHeight;
            SetCursorLock(true);
            UpdateAcousticEnvironment(false);
            StripAllChildColliders();
        }

        private void Update()
        {
            HandleCursorToggle();
            HandleEquipmentHotkeys();
            HandleMouseLook();
            HandleLocomotion();
            HandleCrouch();
            HandleCameraKinematics();
            HandleTraumaShake();
            HandleVisorCondensation();
            HandleSprintFov();
        }

        private void HandleEquipmentHotkeys()
        {
            // [2] -> Equip / Toggle Containment Sealant Kit
            if (Input.GetKeyDown(KeyCode.Alpha2))
            {
                ContainmentKit kit = GetComponentInChildren<ContainmentKit>(true);
                if (kit == null) kit = FindAnyObjectByType<ContainmentKit>();
                if (kit != null)
                {
                    kit.EquipKit();
                }
            }

            // [E] -> Primary Contextual Interaction
            if (Input.GetKeyDown(KeyCode.E))
            {
                PlayerInteraction interaction = GetComponent<PlayerInteraction>();
                if (interaction == null) interaction = GetComponentInChildren<PlayerInteraction>();
                if (interaction == null) interaction = FindAnyObjectByType<PlayerInteraction>();
                if (interaction != null)
                {
                    interaction.TriggerInteraction();
                }
            }
        }

        private void HandleCursorToggle()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                SetCursorLock(false);
            }
            if (!cursorLocked && (Input.GetMouseButtonDown(0) || Input.GetMouseButtonDown(1)))
            {
                SetCursorLock(true);
            }
        }

        public void SetCursorLock(bool locked)
        {
            cursorLocked = locked;
            Cursor.lockState = locked ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !locked;
        }

        private void HandleMouseLook()
        {
            if (!cursorLocked) return;

            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

            verticalRotation -= mouseY;
            verticalRotation = Mathf.Clamp(verticalRotation, -85f, 85f);

            transform.Rotate(Vector3.up * mouseX);
        }

        private bool CheckGrounded()
        {
            if (characterController != null && characterController.isGrounded)
                return true;

            Vector3 rayOrigin = transform.position + Vector3.up * 0.25f;
            float checkDist = groundCheckDistance + 0.1f;
            return Physics.Raycast(rayOrigin, Vector3.down, checkDist, groundCheckMask, QueryTriggerInteraction.Ignore) ||
                   Physics.SphereCast(rayOrigin, 0.25f, Vector3.down, out _, checkDist, groundCheckMask, QueryTriggerInteraction.Ignore);
        }

        private void HandleLocomotion()
        {
            float inputX = Input.GetAxisRaw("Horizontal");
            float inputZ = Input.GetAxisRaw("Vertical");

            bool isSprinting = Input.GetKey(KeyCode.LeftShift) && inputZ > 0.1f && !isCrouching;
            float targetSpeed = isCrouching ? crouchSpeed : (isSprinting ? sprintSpeed : walkSpeed);

            Vector3 inputDirection = (transform.right * inputX + transform.forward * inputZ).normalized;
            targetMoveVector = inputDirection * targetSpeed;

            float accelRate = (inputDirection.magnitude > 0.1f) ? acceleration : deceleration;
            currentMoveVector = Vector3.MoveTowards(currentMoveVector, targetMoveVector, accelRate * Time.deltaTime);

            bool grounded = CheckGrounded();

            if (grounded)
            {
                coyoteTimer = coyoteTime;
                if (!wasGroundedLastFrame && currentVelocity.y < -3.0f)
                {
                    landingOffset = -landingCompressionDistance;
                    AddTrauma(0.15f);
                }
                currentVelocity.y = -2.0f;
            }
            else
            {
                coyoteTimer -= Time.deltaTime;
                currentVelocity.y = Mathf.Max(currentVelocity.y + gravity * Time.deltaTime, -15.0f);
            }

            if (Input.GetButtonDown("Jump") || Input.GetKeyDown(KeyCode.Space))
            {
                jumpBufferTimer = jumpBufferTime;
            }
            else
            {
                jumpBufferTimer -= Time.deltaTime;
            }

            if (jumpBufferTimer > 0f && coyoteTimer > 0f && !isCrouching)
            {
                currentVelocity.y = Mathf.Sqrt(2f * jumpHeight * Mathf.Abs(gravity));
                jumpBufferTimer = 0f;
                coyoteTimer = 0f;
            }

            wasGroundedLastFrame = grounded;
            landingOffset = Mathf.MoveTowards(landingOffset, 0f, springRecoverySpeed * Time.deltaTime);

            Vector3 finalMovement = (currentMoveVector + currentVelocity) * Time.deltaTime;
            if (characterController != null && characterController.enabled)
            {
                characterController.Move(finalMovement);
            }
        }

        private void HandleCrouch()
        {
            if (Input.GetKeyDown(KeyCode.C))
            {
                isCrouching = !isCrouching;
            }

            float targetHeight = isCrouching ? crouchHeight : standingHeight;
            currentHeight = Mathf.Lerp(currentHeight, targetHeight, Time.deltaTime * crouchTransitionSpeed);

            if (characterController != null)
            {
                characterController.height = currentHeight;
                characterController.center = new Vector3(0, currentHeight * 0.5f, 0);
            }
        }


        private void HandleCameraKinematics()
        {
            if (playerCamera == null) return;

            float strafeInput = Input.GetAxisRaw("Horizontal");
            float targetRoll = -strafeInput * strafeRollAngle;
            currentRollAngle = Mathf.Lerp(currentRollAngle, targetRoll, Time.deltaTime * rollSmoothing);

            float horizontalSpeed = new Vector3(characterController != null ? characterController.velocity.x : 0, 0, characterController != null ? characterController.velocity.z : 0).magnitude;
            float bobMultiplier = (Input.GetKey(KeyCode.LeftShift)) ? sprintBobMultiplier : 1.0f;

            Vector3 bobPositionOffset = Vector3.zero;

            bool grounded = CheckGrounded();
            if (horizontalSpeed > 0.2f && grounded)
            {
                bobTimer += Time.deltaTime * bobFrequency * bobMultiplier * Mathf.PI * 2f;
                float verticalBob = Mathf.Sin(bobTimer) * bobVerticalAmplitude * bobMultiplier;
                float horizontalBob = Mathf.Cos(bobTimer * 0.5f) * bobHorizontalAmplitude * bobMultiplier;

                bobPositionOffset = new Vector3(horizontalBob, verticalBob + landingOffset, 0f);
            }
            else
            {
                bobTimer = 0f;
                bobPositionOffset.y = landingOffset;
            }

            float targetCamY = isCrouching ? crouchCameraY : defaultCameraY;
            float currentCamY = Mathf.Lerp(playerCamera.transform.localPosition.y, targetCamY + bobPositionOffset.y, Time.deltaTime * crouchTransitionSpeed);

            playerCamera.transform.localPosition = new Vector3(bobPositionOffset.x, currentCamY, 0f);
            playerCamera.transform.localRotation = Quaternion.Euler(verticalRotation, 0f, currentRollAngle);
        }

        private void HandleSprintFov()
        {
            if (playerCamera == null) return;

            bool isSprinting = Input.GetKey(KeyCode.LeftShift) && Input.GetAxisRaw("Vertical") > 0.1f && !isCrouching;
            float targetFov = isSprinting ? sprintFov : defaultFov;

            GasDetector detector = GetComponentInChildren<GasDetector>();
            if (detector != null && detector.isEquipped && Input.GetMouseButton(1))
                return; // ADS takes FOV priority

            playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFov, Time.deltaTime * fovTransitionSpeed);
        }

        public void AddTrauma(float amount)
        {
            trauma = Mathf.Clamp01(trauma + amount);
        }

        private void HandleTraumaShake()
        {
            if (trauma <= 0.001f || playerCamera == null) return;

            trauma = Mathf.MoveTowards(trauma, 0f, Time.deltaTime * traumaDecayRate);
            float shakePower = trauma * trauma;

            float shakeYaw = (Mathf.PerlinNoise(Time.time * shakeFrequency, 0f) - 0.5f) * 2f * maxShakeRotation * shakePower;
            float shakePitch = (Mathf.PerlinNoise(0f, Time.time * shakeFrequency) - 0.5f) * 2f * maxShakeRotation * shakePower;

            playerCamera.transform.localRotation *= Quaternion.Euler(shakePitch, shakeYaw, 0f);
        }

        private void HandleVisorCondensation()
        {
            if (!hasFullPpe) return;

            breathingTimer += Time.deltaTime;
            float cycleProgress = (breathingTimer % breathingCycleDuration) / breathingCycleDuration;
            visorFogLevel = Mathf.Sin(cycleProgress * Mathf.PI * 2f) * 0.5f + 0.5f;

            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetVisorFogIntensity(visorFogLevel * 0.35f);
            }
        }

        public void UpdateAcousticEnvironment(bool ppeActive)
        {
            hasFullPpe = ppeActive;

            if (masterAudioLowPass != null)
            {
                masterAudioLowPass.cutoffFrequency = ppeActive ? equippedRespiratorCutoff : unequippedCutoff;
            }

            if (respiratorBreathingSource != null)
            {
                if (ppeActive && !respiratorBreathingSource.isPlaying)
                {
                    respiratorBreathingSource.Play();
                }
                else if (!ppeActive && respiratorBreathingSource.isPlaying)
                {
                    respiratorBreathingSource.Stop();
                }
            }
        }
    }
}
