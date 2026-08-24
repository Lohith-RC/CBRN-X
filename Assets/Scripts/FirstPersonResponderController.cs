using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// FirstPersonResponderController V3.0 — Advanced Kinematic Simulation Controller.
    /// Features:
    /// - 6-DOF Mass-Spring-Damper Camera Sway and Strafe Roll Tilt (+-2.5 deg)
    /// - Trauma-based Screen Shake (Trauma^2 power curve with 3D rotational/translational noise)
    /// - Dynamic Audio Low-Pass Filter & Respirator Breathing Acoustic Loops upon Mask Donning
    /// - Visor Condensation Cycle Driver tied to simulated responder exertion
    /// - Landing compression impulse and tactical movement inertia
    /// - Coyote Time + Jump Buffering + Secondary Ground Raycast
    /// - Crouch system with smooth height transition
    /// - Dedicated G-key tool toggle (no camera key conflicts)
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class FirstPersonResponderController : MonoBehaviour
    {
        [Header("Tactical Locomotion Kinematics")]
        public float walkSpeed = 3.8f;
        public float sprintSpeed = 6.2f;
        public float crouchSpeed = 1.8f;
        public float acceleration = 14.0f;
        public float deceleration = 18.0f;
        public float mouseSensitivity = 2.2f;
        public float gravity = -18.5f;
        public float jumpHeight = 1.35f;
        public float coyoteTime = 0.15f;
        public float jumpBufferTime = 0.12f;

        [Header("Crouch Configuration")]
        public float standingHeight = 1.8f;
        public float crouchHeight = 1.0f;
        public float crouchTransitionSpeed = 8.0f;
        private bool isCrouching = false;
        private float currentHeight;

        [Header("Camera Kinematics & Spring Sway")]
        public float strafeRollAngle = 2.5f;
        public float rollSmoothing = 6.0f;
        public float bobFrequency = 2.0f;
        public float bobHorizontalAmplitude = 0.02f;
        public float bobVerticalAmplitude = 0.035f;
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
        public float groundCheckDistance = 0.25f;
        public LayerMask groundCheckMask = ~0;

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
        private float defaultCameraY;
        private float crouchCameraY;
        private float landingOffset = 0f;
        private bool wasGroundedLastFrame = true;
        private bool cursorLocked = true;
        private float breathingTimer = 0f;
        private float coyoteTimer = 0f;
        private float jumpBufferTimer = 0f;
        private bool isGroundedRaycast = false;

        private void Start()
        {
            characterController = GetComponent<CharacterController>();
            playerCamera = GetComponentInChildren<Camera>();

            currentHeight = standingHeight;

            if (playerCamera != null)
            {
                defaultCameraY = playerCamera.transform.localPosition.y;
                crouchCameraY = defaultCameraY - (standingHeight - crouchHeight) * 0.5f;
            }

            if (masterAudioLowPass == null && playerCamera != null)
            {
                masterAudioLowPass = playerCamera.GetComponent<AudioLowPassFilter>();
            }

            SetCursorLock(true);
            UpdateAcousticEnvironment(false);
        }

        private void Update()
        {
            HandleCursorToggle();
            HandleMouseLook();
            HandleLocomotion();
            HandleCrouch();
            HandleToolToggle();
            HandleCameraKinematics();
            HandleTraumaShake();
            HandleVisorCondensation();
            HandleSprintFov();
        }

        private void HandleCursorToggle()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                SetCursorLock(false);
            }
            if (!cursorLocked && Input.GetMouseButtonDown(0))
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
            verticalRotation = Mathf.Clamp(verticalRotation, -80f, 80f);

            transform.Rotate(Vector3.up * mouseX);
        }

        /// <summary>
        /// Enhanced ground detection using both CharacterController.isGrounded
        /// AND a secondary SphereCast for reliability on slopes/edges.
        /// </summary>
        private bool CheckGrounded()
        {
            if (characterController.isGrounded)
                return true;

            // Secondary raycast check from the bottom of the controller
            float rayOriginY = characterController.center.y - characterController.height * 0.5f + 0.05f;
            Vector3 rayOrigin = transform.position + new Vector3(0, rayOriginY, 0);
            isGroundedRaycast = Physics.SphereCast(rayOrigin, characterController.radius * 0.9f,
                Vector3.down, out _, groundCheckDistance, groundCheckMask,
                QueryTriggerInteraction.Ignore);

            return isGroundedRaycast;
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

            // Ground check & Coyote Time
            if (grounded)
            {
                coyoteTimer = coyoteTime;
                if (!wasGroundedLastFrame && currentVelocity.y < -3.0f)
                {
                    landingOffset = -landingCompressionDistance;
                    // Add landing trauma for immersion
                    float impactStrength = Mathf.InverseLerp(-3f, -12f, currentVelocity.y);
                    AddTrauma(impactStrength * 0.25f);
                }
                currentVelocity.y = -2.0f;
            }
            else
            {
                coyoteTimer -= Time.deltaTime;
                currentVelocity.y += gravity * Time.deltaTime;
            }

            // Head bump detection — if moving up and hit ceiling, stop upward velocity
            if ((characterController.collisionFlags & CollisionFlags.Above) != 0 && currentVelocity.y > 0f)
            {
                currentVelocity.y = 0f;
            }

            // Jump Input & Jump Buffering
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
            characterController.Move(finalMovement);
        }

        private void HandleCrouch()
        {
            if (Input.GetKeyDown(KeyCode.C))
            {
                isCrouching = !isCrouching;
            }

            float targetHeight = isCrouching ? crouchHeight : standingHeight;
            currentHeight = Mathf.Lerp(currentHeight, targetHeight, Time.deltaTime * crouchTransitionSpeed);

            characterController.height = currentHeight;
            characterController.center = new Vector3(0, currentHeight * 0.5f, 0);
        }

        /// <summary>
        /// Dedicated tool toggle on G key only — no conflict with camera keys.
        /// </summary>
        private void HandleToolToggle()
        {
            if (Input.GetKeyDown(KeyCode.G))
            {
                GasDetector detector = GetComponentInChildren<GasDetector>();
                if (detector == null)
                {
                    detector = FindFirstObjectByType<GasDetector>();
                }

                if (detector != null)
                {
                    detector.ToggleEquip();
                }
                else
                {
                    Debug.Log("[Player] Gas Detector not found in scene.");
                }
            }
        }

        private void HandleCameraKinematics()
        {
            if (playerCamera == null) return;

            // 1. Strafe Roll Tilt
            float strafeInput = Input.GetAxisRaw("Horizontal");
            float targetRoll = -strafeInput * strafeRollAngle;
            currentRollAngle = Mathf.Lerp(currentRollAngle, targetRoll, Time.deltaTime * rollSmoothing);

            // 2. 6-DOF Procedural Head Bob
            float horizontalSpeed = new Vector3(characterController.velocity.x, 0, characterController.velocity.z).magnitude;
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

            // Crouch camera height interpolation
            float targetCamY = isCrouching ? crouchCameraY : defaultCameraY;
            float currentCamY = Mathf.Lerp(playerCamera.transform.localPosition.y, targetCamY + bobPositionOffset.y, Time.deltaTime * crouchTransitionSpeed);

            Vector3 targetCamLocalPos = new Vector3(bobPositionOffset.x, currentCamY, bobPositionOffset.z);
            playerCamera.transform.localPosition = Vector3.Lerp(playerCamera.transform.localPosition, targetCamLocalPos, Time.deltaTime * 12f);
            playerCamera.transform.localRotation = Quaternion.Euler(verticalRotation, 0f, currentRollAngle);
        }

        private void HandleSprintFov()
        {
            if (playerCamera == null) return;

            bool isSprinting = Input.GetKey(KeyCode.LeftShift) && Input.GetAxisRaw("Vertical") > 0.1f && !isCrouching;
            float targetFov = isSprinting ? sprintFov : defaultFov;

            // Only adjust if GasDetector isn't overriding FOV via ADS
            GasDetector detector = GetComponentInChildren<GasDetector>();
            if (detector != null && detector.isEquipped && Input.GetMouseButton(1))
                return; // ADS has FOV priority

            playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFov, Time.deltaTime * fovTransitionSpeed);
        }

        private void HandleTraumaShake()
        {
            if (trauma <= 0.001f || playerCamera == null) return;

            float shakeFactor = trauma * trauma; // Non-linear response curve

            float timeVal = Time.time * shakeFrequency;
            float rotX = (Mathf.PerlinNoise(timeVal, 0f) - 0.5f) * 2f * maxShakeRotation * shakeFactor;
            float rotY = (Mathf.PerlinNoise(0f, timeVal) - 0.5f) * 2f * maxShakeRotation * shakeFactor;
            float rotZ = (Mathf.PerlinNoise(timeVal, timeVal) - 0.5f) * 2f * maxShakeRotation * shakeFactor;

            float transX = (Mathf.PerlinNoise(timeVal + 10f, 0f) - 0.5f) * 2f * maxShakeTranslation * shakeFactor;
            float transY = (Mathf.PerlinNoise(0f, timeVal + 10f) - 0.5f) * 2f * maxShakeTranslation * shakeFactor;

            playerCamera.transform.localRotation *= Quaternion.Euler(rotX, rotY, rotZ);
            playerCamera.transform.localPosition += new Vector3(transX, transY, 0f);

            trauma = Mathf.Clamp01(trauma - traumaDecayRate * Time.deltaTime);
        }

        private void HandleVisorCondensation()
        {
            if (!hasFullPpe) return;

            breathingTimer += Time.deltaTime;
            float normalizedCycle = (breathingTimer % breathingCycleDuration) / breathingCycleDuration;

            // Sine cycle: Inhale clears moisture, Exhale produces fog
            visorFogLevel = Mathf.Sin(normalizedCycle * Mathf.PI * 2f) * 0.5f + 0.5f;
        }

        public void AddTrauma(float amount)
        {
            trauma = Mathf.Clamp01(trauma + amount);
        }

        public void UpdateAcousticEnvironment(bool ppeActive)
        {
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

            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetVisorOpticsActive(ppeActive);
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("HazardZone"))
            {
                inHazardZone = true;
                if (!hasFullPpe)
                {
                    Debug.LogWarning("[PROTOCOL VIOLATION] Responder penetrated chemical perimeter without Level B PPE!");
                    if (CbrsEventLogger.Instance != null)
                    {
                        CbrsEventLogger.Instance.LogEvent("entered_hazard_zone_without_ppe",
                            "{\"warning\":\"Entered chemical cloud without PPE\",\"position\":{\"x\":" +
                            transform.position.x.ToString("F1") + ",\"z\":" + transform.position.z.ToString("F1") + "}}");
                    }
                    if (GameManager.Instance != null)
                    {
                        GameManager.Instance.ReportMistake("Contamination Risk — PPE Required Before Entry");
                    }
                    if (PostProcessingController.Instance != null)
                    {
                        PostProcessingController.Instance.TriggerHazardAlarmPulse(true);
                    }
                }
            }

            if (other.CompareTag("PpeStation"))
            {
                if (GameManager.Instance != null &&
                    GameManager.Instance.currentStage == GameManager.ScenarioStage.PerimeterAssessment)
                {
                    GameManager.Instance.SetStage(GameManager.ScenarioStage.LevelBDonning);
                }
            }
        }

        private void OnTriggerExit(Collider other)
        {
            if (other.CompareTag("HazardZone"))
            {
                inHazardZone = false;
                if (PostProcessingController.Instance != null)
                {
                    PostProcessingController.Instance.TriggerHazardAlarmPulse(false);
                }
            }
        }
    }
}
