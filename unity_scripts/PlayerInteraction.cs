using UnityEngine;
using UnityEngine.UI;

namespace CBRSX.Unity
{
    /// <summary>
    /// PlayerInteraction V2.0 — Central Desktop-Simulated VR Raycast Dispatcher.
    /// Features:
    /// - SphereCast Assist & Raycast Smoothing for effortless object acquisition
    /// - Tactical Crosshair Color & Scale Interpolation (Pulsing corner brackets on hover)
    /// - Contextual Tooltip Formatting with military/NDRF command verb indicators
    /// - Comprehensive Dispatch across PPE, Spectrometer, Chemical Drums, Civilians, and Containment Kits
    /// </summary>
    public class PlayerInteraction : MonoBehaviour
    {
        [Header("Raycast & Spatial Acquisition")]
        public float interactionRange = 2.8f;
        public float sphereCastRadius = 0.12f;
        public LayerMask interactionLayer;

        [Header("Tactical HUD Reticle Feedback")]
        public Image crosshairImage;
        public Color defaultReticleColor = new Color(1f, 1f, 1f, 0.45f);
        public Color lockedReticleColor = new Color(0.96f, 0.51f, 0.12f, 1.0f); // NDRF Orange
        public float reticleScaleSpeed = 12.0f;

        [Header("Contextual Tooltip Overlay")]
        public TMPro.TextMeshProUGUI tooltipText;
        public GameObject tooltipRoot;

        // Internal State
        private Camera mainCamera;
        private GameObject currentHoverTarget = null;
        private Vector3 defaultReticleScale = Vector3.one;
        private Vector3 lockedReticleScale = new Vector3(1.35f, 1.35f, 1.35f);

        private void Start()
        {
            mainCamera = GetComponent<Camera>();
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }

            if (tooltipRoot != null)
                tooltipRoot.SetActive(false);
        }

        private void Update()
        {
            PerformSpatialRaycast();
        }

        private void PerformSpatialRaycast()
        {
            if (mainCamera == null) return;

            Ray ray = mainCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            RaycastHit hit;

            bool isTargetAcquired = Physics.SphereCast(ray, sphereCastRadius, out hit, interactionRange, interactionLayer);

            // Smooth Reticle Transition
            if (crosshairImage != null)
            {
                Color targetColor = isTargetAcquired ? lockedReticleColor : defaultReticleColor;
                crosshairImage.color = Color.Lerp(crosshairImage.color, targetColor, Time.deltaTime * reticleScaleSpeed);

                Vector3 targetScale = isTargetAcquired ? lockedReticleScale : defaultReticleScale;
                crosshairImage.transform.localScale = Vector3.Lerp(crosshairImage.transform.localScale, targetScale, Time.deltaTime * reticleScaleSpeed);
            }

            if (isTargetAcquired)
            {
                GameObject hitObject = hit.collider.gameObject;
                if (currentHoverTarget != hitObject)
                {
                    currentHoverTarget = hitObject;
                    DisplayContextualTooltip(hitObject);
                }

                if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.E))
                {
                    DispatchInteractionEvent(hitObject);
                }
            }
            else
            {
                if (currentHoverTarget != null)
                {
                    currentHoverTarget = null;
                    HideContextualTooltip();
                }
            }
        }

        private void DispatchInteractionEvent(GameObject target)
        {
            // 1. PPE Station Items
            if (target.CompareTag("PpeItem"))
            {
                PpeStation ppeStation = FindObjectOfType<PpeStation>();
                if (ppeStation != null)
                {
                    string itemName = ParsePpeItemIdentifier(target.name);
                    ppeStation.EquipItem(itemName);
                    target.SetActive(false);
                }
                return;
            }

            // 2. Handheld Multi-Gas Detector
            GasDetector detector = target.GetComponent<GasDetector>();
            if (detector != null)
            {
                detector.EquipDetector();
                return;
            }

            // 3. Chemical Drum (Scanning or Containment)
            LeakDrum drum = target.GetComponent<LeakDrum>();
            if (drum != null)
            {
                HandleDrumInteraction(drum);
                return;
            }

            // 4. Containment Sealant Kit
            ContainmentKit kit = target.GetComponent<ContainmentKit>();
            if (kit != null)
            {
                kit.EquipKit();
                return;
            }

            // 5. Civilian NPC
            Civilian civilian = target.GetComponent<Civilian>();
            if (civilian != null)
            {
                civilian.InstructFollow(transform.root);
                return;
            }
        }

        private void HandleDrumInteraction(LeakDrum drum)
        {
            GameManager gm = GameManager.Instance;

            // Containment Priority if kit is equipped
            if (gm != null && gm.containmentKitEquipped && gm.leakSourceIdentified)
            {
                if (drum.drumId == gm.identifiedDrumId && !drum.isContained)
                {
                    drum.ApplyContainment();
                    return;
                }
                else if (drum.drumId != gm.identifiedDrumId)
                {
                    if (gm != null)
                    {
                        gm.ReportMistake("This is not the confirmed leak source.");
                    }
                    return;
                }
            }

            // Spectrometer Scanning
            GasDetector activeDetector = FindObjectOfType<GasDetector>();
            if (activeDetector != null && activeDetector.isEquipped)
            {
                activeDetector.ScanDrum(drum);
            }
            else
            {
                drum.InspectDrum();
            }
        }

        private string ParsePpeItemIdentifier(string gameObjectName)
        {
            string lower = gameObjectName.ToLower();
            if (lower.Contains("suit") || lower.Contains("hazmat")) return "suit";
            if (lower.Contains("mask") || lower.Contains("respirator")) return "mask";
            if (lower.Contains("glove")) return "gloves";
            return gameObjectName;
        }

        private void DisplayContextualTooltip(GameObject target)
        {
            if (tooltipText == null) return;

            string verbPrompt = "";
            if (target.CompareTag("PpeItem"))
            {
                verbPrompt = $"[E] EQUIP {target.name.Replace("INT_PPE_", "").ToUpper()}";
            }
            else if (target.GetComponent<GasDetector>() != null)
            {
                verbPrompt = "[E] EQUIP ANALYTICAL SPECTROMETER";
            }
            else if (target.GetComponent<LeakDrum>() != null)
            {
                GameManager gm = GameManager.Instance;
                if (gm != null && gm.containmentKitEquipped && gm.leakSourceIdentified)
                {
                    verbPrompt = "[E / HOLD CLICK] INJECT PNEUMATIC SEALANT";
                }
                else
                {
                    verbPrompt = "[E] SCAN DRUM CONCENTRATION";
                }
            }
            else if (target.GetComponent<ContainmentKit>() != null)
            {
                verbPrompt = "[E] EQUIP CONTAINMENT SEAL KIT";
            }
            else if (target.GetComponent<Civilian>() != null)
            {
                verbPrompt = "[E] ORDER CIVILIAN TO FOLLOW";
            }

            if (!string.IsNullOrEmpty(verbPrompt))
            {
                tooltipText.text = verbPrompt;
                if (tooltipRoot != null) tooltipRoot.SetActive(true);
            }
        }

        private void HideContextualTooltip()
        {
            if (tooltipRoot != null)
                tooltipRoot.SetActive(false);
        }
    }
}
