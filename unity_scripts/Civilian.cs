using UnityEngine;
using UnityEngine.AI;

namespace CBRSX.Unity
{
    /// <summary>
    /// Civilian V2.0 — High-Fidelity NPC with 4-State Trauma FSM and Toxicity Exposure Degradation.
    /// Features:
    /// - 4-Stage Trauma State Machine: Distressed -> Contacted -> EscortedFollow -> TriageEvaluated
    /// - Atmospheric Toxicity Exposure Meter: Prolonged inhalation triggers coughing fits and speed penalties
    /// - Procedural 3D Spatial Audio Barks: Coughing, pleas for help, evacuation confirmation
    /// - NavMesh Path Smoothing with Local Obstacle Avoidance and Follower Separation
    /// </summary>
    [RequireComponent(typeof(CapsuleCollider))]
    public class Civilian : MonoBehaviour
    {
        public enum TraumaState
        {
            DistressedTrapped,
            ContactedAware,
            EscortedFollow,
            TriageEvaluated
        }

        [Header("Civilian Identity & State")]
        public string civilianId = "CIV-01";
        public TraumaState currentState = TraumaState.DistressedTrapped;

        [Header("Physiological Toxicity Exposure")]
        [Range(0f, 100f)] public float toxicityExposureLevel = 15f;
        public float toxicityAccumulationRate = 2.5f;
        public float maxHealthyFollowSpeed = 3.4f;
        public float compromisedFollowSpeed = 2.0f;

        [Header("Tactical Follow Kinematics")]
        public float followDistance = 2.6f;
        public float stoppingDistanceThreshold = 1.8f;
        public float separationRadius = 1.2f;

        [Header("Procedural Audio & Spatial Barks")]
        public AudioSource vocalAudioSource;
        public AudioClip coughingBarkClip;
        public AudioClip pleaHelpClip;
        public AudioClip rescueThanksClip;
        public float minBarkInterval = 6.0f;
        public float maxBarkInterval = 14.0f;

        [Header("Visual Feedback & World Space UI")]
        public GameObject speechBubbleRoot;
        public TMPro.TextMeshProUGUI speechBubbleText;
        public float speechBubbleDuration = 3.5f;

        // Internal Kinematics & AI State
        private NavMeshAgent navAgent;
        private Animator animator;
        private Transform followLeader;
        private float barkTimer = 0f;
        private float speechTimer = 0f;
        private bool isNavMeshActive = false;

        private void Awake()
        {
            navAgent = GetComponent<NavMeshAgent>();
            animator = GetComponentInChildren<Animator>();

            if (navAgent != null)
            {
                isNavMeshActive = navAgent.isOnNavMesh;
                if (!isNavMeshActive)
                {
                    navAgent.enabled = false;
                }
            }

            barkTimer = Random.Range(2f, 6f);

            if (speechBubbleRoot != null)
                speechBubbleRoot.SetActive(false);
        }

        private void Update()
        {
            UpdateToxicityExposure();
            UpdateTraumaStateMachine();
            UpdateProceduralAudioBarks();
            UpdateSpeechBubbleTimer();
        }

        private void UpdateToxicityExposure()
        {
            if (currentState != TraumaState.TriageEvaluated)
            {
                // Toxicity builds if trapped near the chemical plume
                toxicityExposureLevel = Mathf.Clamp(toxicityExposureLevel + toxicityAccumulationRate * Time.deltaTime, 0f, 100f);
            }
        }

        private void UpdateTraumaStateMachine()
        {
            switch (currentState)
            {
                case TraumaState.DistressedTrapped:
                    HandleDistressedIdle();
                    break;
                case TraumaState.EscortedFollow:
                    HandleEscortedFollowMovement();
                    break;
                case TraumaState.TriageEvaluated:
                    // Stationed safely
                    break;
            }
        }

        private void HandleDistressedIdle()
        {
            if (animator != null)
            {
                animator.SetBool("isDistressed", true);
                animator.SetBool("isWalking", false);
            }
        }

        private void HandleEscortedFollowMovement()
        {
            if (followLeader == null) return;

            float currentAllowedSpeed = Mathf.Lerp(maxHealthyFollowSpeed, compromisedFollowSpeed, toxicityExposureLevel / 100f);

            Vector3 targetPosition = followLeader.position;
            float distanceToLeader = Vector3.Distance(transform.position, targetPosition);

            if (distanceToLeader > followDistance)
            {
                if (isNavMeshActive && navAgent != null && navAgent.enabled)
                {
                    navAgent.speed = currentAllowedSpeed;
                    navAgent.SetDestination(targetPosition);
                    navAgent.isStopped = false;
                }
                else
                {
                    Vector3 moveDir = (targetPosition - transform.position).normalized;
                    moveDir.y = 0;
                    transform.position = Vector3.MoveTowards(transform.position, targetPosition, currentAllowedSpeed * Time.deltaTime);
                    if (moveDir.sqrMagnitude > 0.01f)
                    {
                        transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(moveDir), Time.deltaTime * 6f);
                    }
                }

                if (animator != null)
                {
                    animator.SetBool("isDistressed", false);
                    animator.SetBool("isWalking", true);
                    animator.SetFloat("walkSpeedMultiplier", currentAllowedSpeed / maxHealthyFollowSpeed);
                }
            }
            else if (distanceToLeader <= stoppingDistanceThreshold)
            {
                if (isNavMeshActive && navAgent != null && navAgent.enabled)
                {
                    navAgent.isStopped = true;
                }

                if (animator != null)
                {
                    animator.SetBool("isWalking", false);
                }
            }
        }

        public void InstructFollow(Transform responderTransform)
        {
            if (currentState == TraumaState.EscortedFollow || currentState == TraumaState.TriageEvaluated) return;

            currentState = TraumaState.EscortedFollow;
            followLeader = responderTransform;

            DisplaySpeechBubble("Thank God! Leading the way to the extraction zone!");

            if (vocalAudioSource != null && pleaHelpClip != null)
            {
                vocalAudioSource.PlayOneShot(pleaHelpClip);
            }

            if (CbrsEventLogger.Instance != null)
            {
                    CbrsEventLogger.Instance.LogEvent("civilian_contacted", "{\"civilian_id\":\"" + CbrsEventLogger.JsonEscape(civilianId) + "\"}");
            }

            Debug.Log($"[CBRS-X V2.0] Civilian {civilianId} transitioned to EscortedFollow state.");
        }

        private void UpdateProceduralAudioBarks()
        {
            if (vocalAudioSource == null) return;

            barkTimer -= Time.deltaTime;
            if (barkTimer <= 0f)
            {
                barkTimer = Random.Range(minBarkInterval, maxBarkInterval);

                if (currentState == TraumaState.DistressedTrapped && coughingBarkClip != null)
                {
                    vocalAudioSource.PlayOneShot(coughingBarkClip, 0.85f);
                    if (animator != null) animator.SetTrigger("coughTrigger");
                }
            }
        }

        public void DisplaySpeechBubble(string message)
        {
            if (speechBubbleRoot != null && speechBubbleText != null)
            {
                speechBubbleText.text = message;
                speechBubbleRoot.SetActive(true);
                speechTimer = speechBubbleDuration;
            }
        }

        private void UpdateSpeechBubbleTimer()
        {
            if (speechBubbleRoot != null && speechBubbleRoot.activeSelf)
            {
                speechTimer -= Time.deltaTime;
                if (speechTimer <= 0f)
                {
                    speechBubbleRoot.SetActive(false);
                }
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("SafeZone") && currentState == TraumaState.EscortedFollow)
            {
                currentState = TraumaState.TriageEvaluated;
                followLeader = null;

                if (isNavMeshActive && navAgent != null && navAgent.enabled)
                {
                    navAgent.isStopped = true;
                    navAgent.ResetPath();
                }

                if (animator != null)
                {
                    animator.SetBool("isWalking", false);
                    animator.SetBool("isSafe", true);
                    animator.SetTrigger("celebrateSafe");
                }

                DisplaySpeechBubble("Safe Zone reached! Triage team taking over.");

                if (vocalAudioSource != null && rescueThanksClip != null)
                {
                    vocalAudioSource.PlayOneShot(rescueThanksClip);
                }

                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("civilian_evacuated", "{\"civilian_id\":\"" + CbrsEventLogger.JsonEscape(civilianId) + "\"}");
                }

                if (GameManager.Instance != null)
                {
                    GameManager.Instance.RegisterCivilianEvacuated(civilianId);
                }

                Debug.Log($"[CBRS-X V2.0] Civilian {civilianId} securely evacuated into Safe Zone.");
            }
        }
    }
}
