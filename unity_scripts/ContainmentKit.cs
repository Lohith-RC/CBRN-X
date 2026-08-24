using UnityEngine;
using UnityEngine.UI;

namespace CBRSX.Unity
{
    /// <summary>
    /// ContainmentKit V2.0 — Two-Stage Magnetic Sealant & Pneumatic Injection Kit.
    /// Features:
    /// - Two-Stage Containment Sequence: Magnetic Clamp Snapping -> Pneumatic Sealant Injection
    /// - Real-time Volumetric Plume Throttling on target LeakDrum during injection hold
    /// - Multi-Layered Acoustic Feedback: Magnetic latch, high-pressure foam injection, seal snap
    /// - Dynamic Circular Progress Bar UI with hold-to-seal cancellation mechanics
    /// </summary>
    public class ContainmentKit : MonoBehaviour
    {
        [Header("Kit Telemetry & State")]
        public bool isEquipped = false;
        public float containmentHoldDuration = 6.0f;

        [Header("Acoustic Injection Feedback")]
        public AudioSource kitAudioSource;
        public AudioClip magneticLatchClip;
        public AudioClip pneumaticFoamHissClip;
        public AudioClip sealCompleteChimeClip;

        [Header("UI Telemetry References")]
        public GameObject containmentProgressBarRoot;
        public Image circularProgressBarFill;
        public TMPro.TextMeshProUGUI containmentStatusPromptText;

        [Header("First-Person Visuals")]
        public GameObject firstPersonHeldTool;

        // Internal State
        private bool isInjectingSealant = false;
        private float currentHoldProgress = 0f;
        private LeakDrum targetedDrum = null;

        private void Start()
        {
            if (containmentProgressBarRoot != null)
                containmentProgressBarRoot.SetActive(false);

            if (firstPersonHeldTool != null)
                firstPersonHeldTool.SetActive(false);
        }

        public void EquipKit()
        {
            if (isEquipped) return;

            isEquipped = true;

            MeshRenderer mr = GetComponent<MeshRenderer>();
            if (mr != null) mr.enabled = false;
            Collider col = GetComponent<Collider>();
            if (col != null) col.enabled = false;

            if (firstPersonHeldTool != null)
                firstPersonHeldTool.SetActive(true);

            if (GameManager.Instance != null)
                GameManager.Instance.RegisterContainmentKitEquipped();

            Debug.Log("[CBRS-X V2.0] Containment Kit acquired into active equipment slot.");
        }

        public void BeginSealSequence(LeakDrum drum)
        {
            if (isInjectingSealant || !isEquipped) return;
            if (drum == null || drum.isContained) return;

            GameManager gm = GameManager.Instance;
            if (gm != null && !gm.leakSourceIdentified)
            {
                Debug.LogWarning("[CBRS-X V2.0] Protocol Violation: Cannot apply containment before analytical leak identification.");
                gm.ReportMistake("Confirm leak source with detector before containment.");
                return;
            }

            isInjectingSealant = true;
            currentHoldProgress = 0f;
            targetedDrum = drum;

            if (containmentProgressBarRoot != null)
                containmentProgressBarRoot.SetActive(true);

            if (containmentStatusPromptText != null)
                containmentStatusPromptText.text = "INJECTING PNEUMATIC SEALANT... HOLD CLICK";

            if (kitAudioSource != null)
            {
                if (magneticLatchClip != null)
                    kitAudioSource.PlayOneShot(magneticLatchClip);

                if (pneumaticFoamHissClip != null)
                {
                    kitAudioSource.clip = pneumaticFoamHissClip;
                    kitAudioSource.loop = true;
                    kitAudioSource.Play();
                }
            }

            if (CbrsEventLogger.Instance != null)
            {
                CbrsEventLogger.Instance.LogEvent("containment_started", "{\"drum_id\":\"" + CbrsEventLogger.JsonEscape(drum.drumId) + "\"}");
            }
        }

        private void Update()
        {
            if (!isInjectingSealant) return;

            if (Input.GetMouseButton(0) || Input.GetKey(KeyCode.E))
            {
                currentHoldProgress += Time.deltaTime;
                float normalizedProgress = Mathf.Clamp01(currentHoldProgress / containmentHoldDuration);

                if (circularProgressBarFill != null)
                {
                    circularProgressBarFill.fillAmount = normalizedProgress;
                }

                // Throttle down plume emission in real-time as sealant fills fissure
                if (targetedDrum != null)
                {
                    targetedDrum.SetPlumeThrottle(1.0f - normalizedProgress);
                }

                if (currentHoldProgress >= containmentHoldDuration)
                {
                    FinalizeContainmentSuccess();
                }
            }
            else
            {
                CancelSealantInjection();
            }
        }

        private void FinalizeContainmentSuccess()
        {
            isInjectingSealant = false;

            if (containmentProgressBarRoot != null)
                containmentProgressBarRoot.SetActive(false);

            if (kitAudioSource != null)
            {
                kitAudioSource.Stop();
                if (sealCompleteChimeClip != null)
                    kitAudioSource.PlayOneShot(sealCompleteChimeClip);
            }

            if (targetedDrum != null)
            {
                targetedDrum.FinalizeContainment();
            }

            targetedDrum = null;
        }

        private void CancelSealantInjection()
        {
            isInjectingSealant = false;
            currentHoldProgress = 0f;

            if (containmentProgressBarRoot != null)
                containmentProgressBarRoot.SetActive(false);

            if (kitAudioSource != null && kitAudioSource.isPlaying)
            {
                kitAudioSource.Stop();
            }

            // Restore plume if cancelled
            if (targetedDrum != null)
            {
                targetedDrum.SetPlumeThrottle(1.0f);
            }

            targetedDrum = null;
            Debug.Log("[CBRS-X V2.0] Sealant injection interrupted — hold required until 100% cure.");
        }
    }
}
