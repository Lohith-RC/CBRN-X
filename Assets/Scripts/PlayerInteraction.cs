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

        private void Awake()
        {
            if (interactionLayer.value == 0)
            {
                interactionLayer = ~LayerMask.GetMask("Ignore Raycast");
            }
            if (interactionRange < 4.0f)
            {
                interactionRange = 4.5f;
            }
            if (sphereCastRadius < 0.2f)
            {
                sphereCastRadius = 0.25f;
            }
        }

        private void Start()
        {
            mainCamera = GetComponent<Camera>();
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
            }

            if (interactionLayer.value == 0)
            {
                interactionLayer = ~LayerMask.GetMask("Ignore Raycast");
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
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
                if (mainCamera == null) return;
            }

            Ray ray = mainCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            RaycastHit hit;

            LayerMask mask = interactionLayer.value != 0 ? interactionLayer : (LayerMask)(~LayerMask.GetMask("Ignore Raycast"));
            bool isTargetAcquired = Physics.SphereCast(ray, sphereCastRadius, out hit, interactionRange, mask);
            if (!isTargetAcquired)
            {
                isTargetAcquired = Physics.Raycast(ray, out hit, interactionRange, mask);
            }

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
                GameObject hitObject = ResolveInteractableObject(hit.collider.gameObject);
                if (currentHoverTarget != hitObject)
                {
                    currentHoverTarget = hitObject;
                    DisplayContextualTooltip(hitObject);
                }

                if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.Space))
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

        private GameObject ResolveInteractableObject(GameObject raw)
        {
            if (raw == null) return null;
            
            // Check self
            if (IsInteractableTarget(raw)) return raw;

            // Check parent
            if (raw.transform.parent != null && IsInteractableTarget(raw.transform.parent.gameObject))
            {
                return raw.transform.parent.gameObject;
            }

            // Check root / ancestor hierarchy
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
                lower.Contains("helmet"))
            {
                return true;
            }

            return go.GetComponent<GasDetector>() != null || 
                   go.GetComponent<LeakDrum>() != null || 
                   go.GetComponent<ContainmentKit>() != null || 
                   go.GetComponent<Civilian>() != null;
        }

        private void DispatchInteractionEvent(GameObject target)
        {
            if (target == null) return;

            string targetNameLower = target.name.ToLower();

            // 1. PPE Station Items (Suit, CBRN Mask, Gloves, HardHat)
            if (target.CompareTag("PpeItem") || targetNameLower.Contains("vest") || 
                targetNameLower.Contains("mask") || targetNameLower.Contains("glove") || 
                targetNameLower.Contains("suit") || targetNameLower.Contains("respirator") ||
                targetNameLower.Contains("gasmask") || targetNameLower.Contains("cbrn") ||
                targetNameLower.Contains("hardhat") || targetNameLower.Contains("helmet"))
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
            if (detector == null && target.transform.parent != null) detector = target.transform.parent.GetComponent<GasDetector>();
            if (detector != null || targetNameLower.Contains("detector") || targetNameLower.Contains("spectrometer") || targetNameLower.Contains("pid"))
            {
                FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
                if (responder != null)
                {
                    GasDetector playerDet = responder.GetComponentInChildren<GasDetector>();
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

                target.SetActive(false);
                return;
            }

            // 3. Chemical Drum (Scanning or Containment)
            LeakDrum drum = target.GetComponent<LeakDrum>();
            if (drum == null && target.transform.parent != null) drum = target.transform.parent.GetComponent<LeakDrum>();
            if (drum != null)
            {
                HandleDrumInteraction(drum);
                return;
            }

            // 4. Containment Sealant Kit
            ContainmentKit kit = target.GetComponent<ContainmentKit>();
            if (kit == null && target.transform.parent != null) kit = target.transform.parent.GetComponent<ContainmentKit>();
            if (kit != null)
            {
                kit.EquipKit();
                return;
            }

            // 5. Civilian NPC
            Civilian civilian = target.GetComponent<Civilian>();
            if (civilian == null && target.transform.parent != null) civilian = target.transform.parent.GetComponent<Civilian>();
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
                PpeStation station = Object.FindObjectOfType<PpeStation>();
                if (station != null)
                {
                    if (!station.maskEquipped) return "mask";
                    if (!station.suitEquipped) return "suit";
                }
                return "mask";
            }
            return gameObjectName;
        }

        private void DisplayContextualTooltip(GameObject target)
        {
            if (tooltipText == null || target == null) return;

            string verbPrompt = "";
            string lower = target.name.ToLower();
            if (target.CompareTag("PpeItem") || lower.Contains("vest") || lower.Contains("mask") || lower.Contains("glove") || 
                lower.Contains("suit") || lower.Contains("respirator") || lower.Contains("gasmask") || lower.Contains("cbrn") ||
                lower.Contains("hardhat") || lower.Contains("helmet"))
            {
                string id = ParsePpeItemIdentifier(target.name).ToLower();
                if (id == "mask")
                {
                    verbPrompt = "[E / CLICK] DON CBRN GAS MASK / RESPIRATOR";
                }
                else if (id == "suit")
                {
                    verbPrompt = "[E / CLICK] DON LEVEL B HAZMAT SUIT";
                }
                else if (id == "gloves")
                {
                    verbPrompt = "[E / CLICK] DON CHEMICAL RESISTANT GLOVES";
                }
                else
                {
                    verbPrompt = $"[E / CLICK] EQUIP LEVEL B {id.ToUpper()}";
                }
            }
            else if (target.GetComponent<GasDetector>() != null || (target.transform.parent != null && target.transform.parent.GetComponent<GasDetector>() != null))
            {
                verbPrompt = "[E] EQUIP ANALYTICAL SPECTROMETER";
            }
            else if (target.GetComponent<LeakDrum>() != null || (target.transform.parent != null && target.transform.parent.GetComponent<LeakDrum>() != null))
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
            else if (target.GetComponent<ContainmentKit>() != null || (target.transform.parent != null && target.transform.parent.GetComponent<ContainmentKit>() != null))
            {
                verbPrompt = "[E] EQUIP CONTAINMENT SEAL KIT";
            }
            else if (target.GetComponent<Civilian>() != null || (target.transform.parent != null && target.transform.parent.GetComponent<Civilian>() != null))
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
