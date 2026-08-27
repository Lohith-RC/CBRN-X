using UnityEngine;
using UnityEngine.UI;

namespace CBRSX.Unity
{
    /// <summary>
    /// PlayerInteraction V3.0 — High-Tolerance Tactical Interaction & Equipping Engine.
    /// Features:
    /// - Generous SphereCast acquisition + Proximity auto-target fallback
    /// - Instant equipping on [E], [Left Click], or [Space]
    /// - Comprehensive recognition of all PPE items, PID Detector, Containment Kit, and Leak Drums
    /// </summary>
    public class PlayerInteraction : MonoBehaviour
    {
        [Header("Raycast & Spatial Acquisition")]
        public float interactionRange = 5.5f;
        public float sphereCastRadius = 0.45f;
        public float proximityFallbackRadius = 3.5f;
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

        private void Awake()
        {
            if (interactionLayer.value == 0)
            {
                interactionLayer = ~LayerMask.GetMask("Ignore Raycast");
            }
        }

        private void Start()
        {
            EnsureCameraReference();

            if (tooltipRoot != null)
                tooltipRoot.SetActive(false);
        }

        private void EnsureCameraReference()
        {
            if (mainCamera == null)
            {
                mainCamera = GetComponent<Camera>();
                if (mainCamera == null)
                {
                    mainCamera = Camera.main;
                }
            }
        }

        private void Update()
        {
            EnsureCameraReference();
            PerformSpatialRaycast();
            HandleDirectKeyShortcuts();
        }

        private void HandleDirectKeyShortcuts()
        {
            // Global Proximity Fallback on E or Click if no raycast target is centered
            if (Input.GetKeyDown(KeyCode.E) || Input.GetMouseButtonDown(0))
            {
                if (currentHoverTarget == null)
                {
                    GameObject proximityTarget = FindClosestInteractableInProximity();
                    if (proximityTarget != null)
                    {
                        DispatchInteractionEvent(proximityTarget);
                    }
                }
            }
        }

        private void PerformSpatialRaycast()
        {
            if (mainCamera == null) return;

            Ray ray = mainCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            RaycastHit hit;

            LayerMask mask = interactionLayer.value != 0 ? interactionLayer : (LayerMask)(~LayerMask.GetMask("Ignore Raycast"));
            bool isTargetAcquired = Physics.SphereCast(ray, sphereCastRadius, out hit, interactionRange, mask) ||
                                    Physics.Raycast(ray, out hit, interactionRange, mask);

            GameObject targetCandidate = null;
            if (isTargetAcquired)
            {
                targetCandidate = ResolveInteractableObject(hit.collider.gameObject);
            }

            // If raycast didn't find anything, try close proximity fallback
            if (targetCandidate == null)
            {
                targetCandidate = FindClosestInteractableInProximity();
            }

            // Update Reticle Feedback
            if (crosshairImage != null)
            {
                Color targetColor = (targetCandidate != null) ? lockedReticleColor : defaultReticleColor;
                crosshairImage.color = Color.Lerp(crosshairImage.color, targetColor, Time.deltaTime * reticleScaleSpeed);

                Vector3 targetScale = (targetCandidate != null) ? lockedReticleScale : defaultReticleScale;
                crosshairImage.transform.localScale = Vector3.Lerp(crosshairImage.transform.localScale, targetScale, Time.deltaTime * reticleScaleSpeed);
            }

            if (targetCandidate != null)
            {
                if (currentHoverTarget != targetCandidate)
                {
                    currentHoverTarget = targetCandidate;
                    DisplayContextualTooltip(targetCandidate);
                }

                if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.Space))
                {
                    DispatchInteractionEvent(targetCandidate);
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

        private GameObject FindClosestInteractableInProximity()
        {
            Vector3 playerPos = transform.position;
            Collider[] hits = Physics.OverlapSphere(playerPos, proximityFallbackRadius);
            
            float closestDist = float.MaxValue;
            GameObject bestTarget = null;

            foreach (var h in hits)
            {
                if (h.transform.root == transform.root) continue; // skip self

                GameObject resolved = ResolveInteractableObject(h.gameObject);
                if (resolved != null && IsInteractableTarget(resolved))
                {
                    float dist = Vector3.Distance(playerPos, resolved.transform.position);
                    if (dist < closestDist)
                    {
                        closestDist = dist;
                        bestTarget = resolved;
                    }
                }
            }

            return bestTarget;
        }

        private GameObject ResolveInteractableObject(GameObject raw)
        {
            if (raw == null) return null;
            if (IsInteractableTarget(raw)) return raw;

            Transform current = raw.transform.parent;
            while (current != null)
            {
                if (IsInteractableTarget(current.gameObject))
                {
                    return current.gameObject;
                }
                current = current.parent;
            }

            return raw;
        }

        private bool IsInteractableTarget(GameObject go)
        {
            if (go == null) return false;
            string lower = go.name.ToLower();

            if (go.CompareTag("PpeItem") || lower.Contains("vest") || lower.Contains("mask") || 
                lower.Contains("glove") || lower.Contains("suit") || lower.Contains("respirator") || 
                lower.Contains("gasmask") || lower.Contains("cbrn") || lower.Contains("hardhat") || 
                lower.Contains("helmet") || lower.Contains("bench") || lower.Contains("ppe"))
            {
                return true;
            }

            return go.GetComponent<GasDetector>() != null || 
                   go.GetComponent<LeakDrum>() != null || 
                   go.GetComponent<ContainmentKit>() != null || 
                   go.GetComponent<Civilian>() != null ||
                   lower.Contains("detector") ||
                   lower.Contains("spectrometer") ||
                   lower.Contains("drum") ||
                   lower.Contains("kit") ||
                   lower.Contains("decon");
        }

        public void DispatchInteractionEvent(GameObject target)
        {
            if (target == null) return;

            string targetNameLower = target.name.ToLower();

            // 1. PPE Station Items (Suit, CBRN Mask, Gloves, HardHat, Workbench)
            if (target.CompareTag("PpeItem") || targetNameLower.Contains("vest") || 
                targetNameLower.Contains("mask") || targetNameLower.Contains("glove") || 
                targetNameLower.Contains("suit") || targetNameLower.Contains("respirator") ||
                targetNameLower.Contains("gasmask") || targetNameLower.Contains("cbrn") ||
                targetNameLower.Contains("hardhat") || targetNameLower.Contains("helmet") ||
                targetNameLower.Contains("bench") || targetNameLower.Contains("ppe"))
            {
                PpeStation ppeStation = FindFirstObjectByType<PpeStation>();
                if (ppeStation != null)
                {
                    string itemName = ParsePpeItemIdentifier(target.name);
                    ppeStation.EquipItem(itemName);
                    if (!targetNameLower.Contains("bench") && !targetNameLower.Contains("staging"))
                    {
                        target.SetActive(false);
                    }
                }
                return;
            }

            // 2. Handheld Multi-Gas Detector
            GasDetector detector = target.GetComponent<GasDetector>();
            if (detector == null && target.transform.parent != null) detector = target.transform.parent.GetComponent<GasDetector>();
            if (detector != null || targetNameLower.Contains("detector") || targetNameLower.Contains("spectrometer") || targetNameLower.Contains("pid"))
            {
                FirstPersonResponderController responder = FindFirstObjectByType<FirstPersonResponderController>();
                if (responder != null)
                {
                    GasDetector playerDet = responder.GetComponentInChildren<GasDetector>(true);
                    if (playerDet != null)
                    {
                        playerDet.EquipDetector();
                    }
                    else if (detector != null)
                    {
                        detector.EquipDetector();
                    }
                }
                else if (detector != null)
                {
                    detector.EquipDetector();
                }

                if (target.transform.root != transform.root)
                {
                    target.SetActive(false);
                }
                return;
            }

            // 3. Chemical Drum (Scanning or Containment)
            LeakDrum drum = target.GetComponent<LeakDrum>();
            if (drum == null && target.transform.parent != null) drum = target.transform.parent.GetComponent<LeakDrum>();
            if (drum != null || targetNameLower.Contains("drum") || targetNameLower.Contains("barrel"))
            {
                if (drum == null) drum = FindFirstObjectByType<LeakDrum>();
                if (drum != null)
                {
                    HandleDrumInteraction(drum);
                }
                return;
            }

            // 4. Containment Sealant Kit
            ContainmentKit kit = target.GetComponent<ContainmentKit>();
            if (kit == null && target.transform.parent != null) kit = target.transform.parent.GetComponent<ContainmentKit>();
            if (kit != null || targetNameLower.Contains("kit") || targetNameLower.Contains("sealant"))
            {
                if (kit == null) kit = FindFirstObjectByType<ContainmentKit>();
                if (kit != null)
                {
                    kit.EquipKit();
                }
                return;
            }

            // 5. Civilian NPC
            Civilian civilian = target.GetComponent<Civilian>();
            if (civilian == null && target.transform.parent != null) civilian = target.transform.parent.GetComponent<Civilian>();
            if (civilian != null || targetNameLower.Contains("civilian") || targetNameLower.Contains("worker"))
            {
                if (civilian == null) civilian = FindFirstObjectByType<Civilian>();
                if (civilian != null)
                {
                    civilian.InstructFollow(transform.root);
                }
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
            GasDetector activeDetector = FindFirstObjectByType<GasDetector>();
            if (activeDetector != null && activeDetector.isEquipped)
            {
                activeDetector.ScanDrum(drum);
            }
            else
            {
                drum.InspectDrum();
            }
        }

        public static string ParsePpeItemIdentifier(string gameObjectName)
        {
            string lower = gameObjectName.ToLower();
            if (lower.Contains("mask") || lower.Contains("respirator") || lower.Contains("gasmask") || lower.Contains("cbrn") || lower.Contains("filter") || lower.Contains("visor"))
            {
                return "mask";
            }
            if (lower.Contains("suit") || lower.Contains("hazmat") || lower.Contains("vest") || lower.Contains("jacket"))
            {
                return "suit";
            }
            if (lower.Contains("glove") || lower.Contains("gauntlet") || lower.Contains("hand"))
            {
                return "gloves";
            }
            if (lower.Contains("hardhat") || lower.Contains("helmet") || lower.Contains("head"))
            {
                return "hardhat";
            }
            return "ppe_gear";
        }

        private void DisplayContextualTooltip(GameObject target)
        {
            if (tooltipRoot == null || tooltipText == null) return;

            string targetNameLower = target.name.ToLower();
            string prompt = "[E / CLICK] INTERACT";

            if (targetNameLower.Contains("mask") || targetNameLower.Contains("respirator"))
                prompt = "[E / CLICK] DON CBRN FULL-FACE RESPIRATOR";
            else if (targetNameLower.Contains("suit") || targetNameLower.Contains("hazmat") || targetNameLower.Contains("vest"))
                prompt = "[E / CLICK] DON LEVEL-B HAZMAT ENSEMBLE";
            else if (targetNameLower.Contains("glove"))
                prompt = "[E / CLICK] DON CHEMICAL GAUNTLETS";
            else if (targetNameLower.Contains("bench") || targetNameLower.Contains("ppe"))
                prompt = "[E / CLICK] DON NEXT REQUIRED PPE GEAR";
            else if (targetNameLower.Contains("detector") || targetNameLower.Contains("spectrometer") || targetNameLower.Contains("pid"))
                prompt = "[E / CLICK] EQUIP HANDHELD PID SPECTROMETER";
            else if (targetNameLower.Contains("drum") || targetNameLower.Contains("barrel"))
                prompt = "[E / CLICK] SCAN CHEMICAL DRUM PPM CONCENTRATION";
            else if (targetNameLower.Contains("kit"))
                prompt = "[E / CLICK] EQUIP LEAK CONTAINMENT SEALANT KIT";
            else if (targetNameLower.Contains("civilian") || targetNameLower.Contains("worker"))
                prompt = "[E / CLICK] EVACUATE INJURED PERSONNEL";

            tooltipText.text = prompt;
            tooltipRoot.SetActive(true);
        }

        private void HideContextualTooltip()
        {
            if (tooltipRoot != null)
                tooltipRoot.SetActive(false);
        }
    }
}
