using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

namespace CBRSX.Unity
{
    /// <summary>
    /// HudManager V3.0 — Tactical Military HUD & Operational Telemetry Display.
    /// Features:
    /// - Dynamic Tactical Compass Rose displaying real-time cardinal headings (0-360 deg)
    /// - Animated Level B PPE Checklist with pulsing checkmark confirmation transitions
    /// - Typewriter-animated Mission Prompt Ribbon with dramatic character-by-character reveal
    /// - Warning Toast Popups & Achievement Banners with smooth alpha interpolation
    /// - Stage Progress Bar showing 0-7 stage completion
    /// - Distance-to-Objective readout from WaypointNavigationSystem
    /// - Screen-edge objective direction indicator
    /// </summary>
    public class HudManager : MonoBehaviour
    {
        [Header("Tactical Mission Objective Ribbon")]
        public TextMeshProUGUI stagePromptText;
        public float typewriterSpeed = 0.03f;

        [Header("Tactical Compass Rose")]
        public TextMeshProUGUI compassHeadingText;
        public Transform compassDialTransform;

        [Header("Level B PPE Donning Checklist")]
        public Image suitIcon;
        public Image maskIcon;
        public Image glovesIcon;
        public GameObject suitCheckmark;
        public GameObject maskCheckmark;
        public GameObject glovesCheckmark;
        public Color equippedColor = new Color(0.2f, 0.95f, 0.35f, 1.0f);
        public Color unequippedColor = new Color(0.45f, 0.45f, 0.45f, 0.4f);

        [Header("Operational Mission Timer")]
        public TextMeshProUGUI missionTimerText;

        [Header("Warning & Toast Alerts")]
        public GameObject mistakeToastRoot;
        public TextMeshProUGUI mistakeToastText;
        public float mistakeToastDuration = 3.0f;

        [Header("Achievement Banners")]
        public GameObject achievementBannerRoot;
        public TextMeshProUGUI achievementBannerText;
        public float achievementBannerDuration = 4.0f;

        [Header("Stage Progress Bar")]
        public Image stageProgressFill;
        public TextMeshProUGUI stageProgressLabel;
        public int totalStages = 7;

        [Header("Distance to Objective")]
        public TextMeshProUGUI distanceToObjectiveText;

        [Header("Screen-Edge Objective Indicator")]
        public RectTransform objectiveIndicatorArrow;
        public float indicatorEdgeMargin = 60f;

        [Header("Keyboard Hints")]
        public TextMeshProUGUI keyHintsText;

        // Internal State
        private float mistakeTimer = 0f;
        private float achievementTimer = 0f;
        private GameManager gm;
        private Camera mainCam;
        private Coroutine typewriterCoroutine;
        private string currentFullText = "";
        private float ppeEquipPulseTimer = 0f;
        private string lastEquippedItem = "";

        private void Awake()
        {
            AutoBindUIReferences();
        }

        public void AutoBindUIReferences()
        {
            TextMeshProUGUI[] tmps = GetComponentsInChildren<TextMeshProUGUI>(true);
            foreach (var t in tmps)
            {
                string n = t.name.ToLower();
                if (stagePromptText == null && (n.Contains("prompt") || n.Contains("objective") || n.Contains("ribbon"))) stagePromptText = t;
                else if (missionTimerText == null && (n.Contains("timer") || n.Contains("clock"))) missionTimerText = t;
                else if (compassHeadingText == null && (n.Contains("compass") || n.Contains("heading"))) compassHeadingText = t;
                else if (distanceToObjectiveText == null && (n.Contains("distance") || n.Contains("range") || n.Contains("dist"))) distanceToObjectiveText = t;
                else if (keyHintsText == null && (n.Contains("key") || n.Contains("hint") || n.Contains("control"))) keyHintsText = t;
                else if (mistakeToastText == null && (n.Contains("toast") || n.Contains("mistake") || n.Contains("warn"))) mistakeToastText = t;
                else if (achievementBannerText == null && (n.Contains("achievement") || n.Contains("banner") || n.Contains("title"))) achievementBannerText = t;
                else if (stageProgressLabel == null && (n.Contains("progress") && n.Contains("label"))) stageProgressLabel = t;
            }

            Image[] imgs = GetComponentsInChildren<Image>(true);
            foreach (var img in imgs)
            {
                string n = img.name.ToLower();
                if (suitIcon == null && (n.Contains("suit") || n.Contains("vest"))) suitIcon = img;
                else if (maskIcon == null && (n.Contains("mask") || n.Contains("respirator"))) maskIcon = img;
                else if (glovesIcon == null && (n.Contains("glove") || n.Contains("gauntlet"))) glovesIcon = img;
                else if (stageProgressFill == null && n.Contains("fill")) stageProgressFill = img;
            }

            Transform[] allTrans = GetComponentsInChildren<Transform>(true);
            foreach (var tr in allTrans)
            {
                string n = tr.name.ToLower();
                if (suitCheckmark == null && n.Contains("suit") && n.Contains("check")) suitCheckmark = tr.gameObject;
                else if (maskCheckmark == null && n.Contains("mask") && n.Contains("check")) maskCheckmark = tr.gameObject;
                else if (glovesCheckmark == null && n.Contains("glove") && n.Contains("check")) glovesCheckmark = tr.gameObject;
                else if (mistakeToastRoot == null && (n.Contains("toast") || n.Contains("mistake_root"))) mistakeToastRoot = tr.gameObject;
                else if (achievementBannerRoot == null && (n.Contains("banner_root") || n.Contains("achievement_root"))) achievementBannerRoot = tr.gameObject;
                else if (objectiveIndicatorArrow == null && (n.Contains("indicator") || n.Contains("arrow"))) objectiveIndicatorArrow = tr as RectTransform;
            }
        }

        private void Start()
        {
            AutoBindUIReferences();
            gm = GameManager.Instance;
            mainCam = Camera.main;

            SetPpeIconState(suitIcon, suitCheckmark, false);
            SetPpeIconState(maskIcon, maskCheckmark, false);
            SetPpeIconState(glovesIcon, glovesCheckmark, false);

            if (mistakeToastRoot != null) mistakeToastRoot.SetActive(false);
            if (achievementBannerRoot != null) achievementBannerRoot.SetActive(false);
            if (objectiveIndicatorArrow != null) objectiveIndicatorArrow.gameObject.SetActive(false);

            if (gm != null)
            {
                gm.OnStageTransition += HandleStageChanged;
                gm.OnPpeItemEquippedEvent += HandlePpeItemEquipped;
                gm.OnFullPpeCompletedEvent += HandleFullPpeCompleted;
                gm.OnLeakSourceConfirmedEvent += HandleLeakConfirmed;
                gm.OnCivilianRescuedEvent += HandleCivilianRescued;
                gm.OnContainmentFinishedEvent += HandleContainmentFinished;
                gm.OnDecontaminationFinishedEvent += HandleDeconFinished;
                gm.OnProtocolMistakeReported += DisplayMistakeToast;
            }

            UpdateStagePromptRibbon();
            UpdateStageProgressBar();
            UpdateKeyHints();
        }

        private void OnDestroy()
        {
            if (gm != null)
            {
                gm.OnStageTransition -= HandleStageChanged;
                gm.OnPpeItemEquippedEvent -= HandlePpeItemEquipped;
                gm.OnFullPpeCompletedEvent -= HandleFullPpeCompleted;
                gm.OnLeakSourceConfirmedEvent -= HandleLeakConfirmed;
                gm.OnCivilianRescuedEvent -= HandleCivilianRescued;
                gm.OnContainmentFinishedEvent -= HandleContainmentFinished;
                gm.OnDecontaminationFinishedEvent -= HandleDeconFinished;
                gm.OnProtocolMistakeReported -= DisplayMistakeToast;
            }
        }

        private void Update()
        {
            UpdateMissionTimer();
            UpdateCompassRose();
            UpdateToastTimers();
            UpdateDistanceToObjective();
            UpdateObjectiveIndicator();
            UpdatePpeEquipPulse();
        }

        private void UpdateMissionTimer()
        {
            if (missionTimerText == null || gm == null || gm.scenarioStartTime <= 0f) return;

            float elapsed = Time.time - gm.scenarioStartTime;
            int minutes = Mathf.FloorToInt(elapsed / 60f);
            int seconds = Mathf.FloorToInt(elapsed % 60f);
            missionTimerText.text = $"{minutes:00}:{seconds:00}";
        }

        private void UpdateCompassRose()
        {
            if (mainCam == null) return;

            float headingAngle = mainCam.transform.eulerAngles.y;

            if (compassHeadingText != null)
            {
                compassHeadingText.text = $"{Mathf.RoundToInt(headingAngle):000}° {GetCardinalDirection(headingAngle)}";
            }

            if (compassDialTransform != null)
            {
                compassDialTransform.localRotation = Quaternion.Euler(0f, 0f, headingAngle);
            }
        }

        private string GetCardinalDirection(float angle)
        {
            if (angle >= 337.5f || angle < 22.5f) return "N";
            if (angle >= 22.5f && angle < 67.5f) return "NE";
            if (angle >= 67.5f && angle < 112.5f) return "E";
            if (angle >= 112.5f && angle < 157.5f) return "SE";
            if (angle >= 157.5f && angle < 202.5f) return "S";
            if (angle >= 202.5f && angle < 247.5f) return "SW";
            if (angle >= 247.5f && angle < 292.5f) return "W";
            return "NW";
        }

        private void HandleStageChanged(GameManager.ScenarioStage newStage)
        {
            UpdateStagePromptRibbon();
            UpdateStageProgressBar();
            UpdateKeyHints();
        }

        private void HandlePpeItemEquipped(string itemKey)
        {
            lastEquippedItem = itemKey.ToLower();
            ppeEquipPulseTimer = 0.6f; // Pulse duration

            switch (lastEquippedItem)
            {
                case "suit":
                    SetPpeIconState(suitIcon, suitCheckmark, true);
                    break;
                case "mask":
                    SetPpeIconState(maskIcon, maskCheckmark, true);
                    break;
                case "gloves":
                    SetPpeIconState(glovesIcon, glovesCheckmark, true);
                    break;
            }
        }

        private void UpdatePpeEquipPulse()
        {
            if (ppeEquipPulseTimer <= 0f) return;

            ppeEquipPulseTimer -= Time.deltaTime;
            float pulse = 1.0f + Mathf.Sin(ppeEquipPulseTimer * 15f) * 0.2f;

            Image targetIcon = null;
            switch (lastEquippedItem)
            {
                case "suit": targetIcon = suitIcon; break;
                case "mask": targetIcon = maskIcon; break;
                case "gloves": targetIcon = glovesIcon; break;
            }

            if (targetIcon != null)
            {
                targetIcon.transform.localScale = Vector3.one * pulse;
            }

            if (ppeEquipPulseTimer <= 0f && targetIcon != null)
            {
                targetIcon.transform.localScale = Vector3.one;
            }
        }

        private void HandleFullPpeCompleted()
        {
            DisplayAchievementBanner("LEVEL B CBRN PPE ENSEMBLE AUTHORIZED // HAZARD CLEARANCE GRANTED");
        }

        private void HandleLeakConfirmed()
        {
            DisplayAchievementBanner("PRIMARY LEAK SOURCE CONFIRMED // PROCEED WITH EVACUATION");
        }

        private void HandleCivilianRescued(string civilianId)
        {
            UpdateStagePromptRibbon();
        }

        private void HandleContainmentFinished()
        {
            DisplayAchievementBanner("FISSURE HERMETICALLY SEALED // PROCEED TO DELUGE DECON");
        }

        private void HandleDeconFinished()
        {
            DisplayAchievementBanner("DECONTAMINATION DELUGE COMPLETE // ALL AGENTS NEUTRALIZED");
        }

        private void UpdateStagePromptRibbon()
        {
            if (stagePromptText == null || gm == null) return;

            string newText = gm.GetStageObjectiveText();
            if (newText != currentFullText)
            {
                currentFullText = newText;

                if (typewriterCoroutine != null)
                    StopCoroutine(typewriterCoroutine);

                typewriterCoroutine = StartCoroutine(TypewriterReveal(newText));
            }
        }

        private IEnumerator TypewriterReveal(string fullText)
        {
            stagePromptText.text = "";

            for (int i = 0; i <= fullText.Length; i++)
            {
                stagePromptText.text = fullText.Substring(0, i);

                // Add cursor blink effect
                if (i < fullText.Length)
                {
                    stagePromptText.text += "<color=#FFD700>▌</color>";
                }

                yield return new WaitForSeconds(typewriterSpeed);
            }

            typewriterCoroutine = null;
        }

        private void UpdateStageProgressBar()
        {
            if (gm == null) return;

            int stageIndex = (int)gm.currentStage;

            if (stageProgressFill != null)
            {
                float targetFill = (float)stageIndex / totalStages;
                stageProgressFill.fillAmount = Mathf.Lerp(stageProgressFill.fillAmount, targetFill, Time.deltaTime * 4f);
            }

            if (stageProgressLabel != null)
            {
                stageProgressLabel.text = $"STAGE {stageIndex}/{totalStages}";
            }
        }

        private void UpdateDistanceToObjective()
        {
            if (distanceToObjectiveText == null) return;

            if (WaypointNavigationSystem.Instance != null)
            {
                float dist = WaypointNavigationSystem.Instance.GetDistanceToActiveWaypoint();
                string label = WaypointNavigationSystem.Instance.GetActiveWaypointLabel();

                if (dist > 0f)
                {
                    distanceToObjectiveText.text = $"{dist:F1}m → {label}";
                    distanceToObjectiveText.gameObject.SetActive(true);
                }
                else
                {
                    distanceToObjectiveText.gameObject.SetActive(false);
                }
            }
            else
            {
                distanceToObjectiveText.gameObject.SetActive(false);
            }
        }

        private void UpdateObjectiveIndicator()
        {
            if (objectiveIndicatorArrow == null || mainCam == null) return;

            if (WaypointNavigationSystem.Instance == null)
            {
                objectiveIndicatorArrow.gameObject.SetActive(false);
                return;
            }

            float dist = WaypointNavigationSystem.Instance.GetDistanceToActiveWaypoint();
            if (dist < 0f)
            {
                objectiveIndicatorArrow.gameObject.SetActive(false);
                return;
            }

            // Only show when objective is off-screen
            objectiveIndicatorArrow.gameObject.SetActive(dist > 5f);
        }

        private void UpdateKeyHints()
        {
            if (keyHintsText == null || gm == null) return;

            switch (gm.currentStage)
            {
                case GameManager.ScenarioStage.BriefingOperational:
                case GameManager.ScenarioStage.PerimeterAssessment:
                case GameManager.ScenarioStage.LevelBDonning:
                    keyHintsText.text = "[WASD] Move  [E/CLICK] Don PPE (Vest, Mask, Gloves)  [SHIFT] Sprint";
                    break;
                case GameManager.ScenarioStage.ChemicalSpectrometry:
                    keyHintsText.text = "[WASD] Enter Bay 03 Corridor  [E/CLICK] Inspect Leaking Drum  [SHIFT] Sprint";
                    break;
                case GameManager.ScenarioStage.CivilianExtraction:
                    keyHintsText.text = "[E/CLICK] Command Injured Civilian to Follow  [WASD] Move";
                    break;
                case GameManager.ScenarioStage.HazardContainment:
                    keyHintsText.text = "[2] Equip Sealant Kit  [HOLD LMB] Inject Pneumatic Sealant";
                    break;
                case GameManager.ScenarioStage.DeconNeutralization:
                    keyHintsText.text = "Walk into Decontamination Deluge Shower Archway";
                    break;
                default:
                    keyHintsText.text = "[WASD] Move  [SHIFT] Sprint  [C] Crouch  [SPACE] Jump";
                    break;
            }
        }

        private void SetPpeIconState(Image icon, GameObject checkmark, bool active)
        {
            if (icon != null) icon.color = active ? equippedColor : unequippedColor;
            if (checkmark != null) checkmark.SetActive(active);
        }

        public void DisplayMistakeToast(string message)
        {
            if (mistakeToastRoot == null || mistakeToastText == null) return;

            mistakeToastText.text = $"[WARNING] {message}";
            mistakeToastRoot.SetActive(true);
            mistakeTimer = mistakeToastDuration;
        }

        public void DisplayAchievementBanner(string message)
        {
            if (achievementBannerRoot == null || achievementBannerText == null) return;

            achievementBannerText.text = message;
            achievementBannerRoot.SetActive(true);
            achievementTimer = achievementBannerDuration;
        }

        private void UpdateToastTimers()
        {
            if (mistakeToastRoot != null && mistakeToastRoot.activeSelf)
            {
                mistakeTimer -= Time.deltaTime;
                if (mistakeTimer <= 0f)
                {
                    mistakeToastRoot.SetActive(false);
                }
            }

            if (achievementBannerRoot != null && achievementBannerRoot.activeSelf)
            {
                achievementTimer -= Time.deltaTime;
                if (achievementTimer <= 0f)
                {
                    achievementBannerRoot.SetActive(false);
                }
            }
        }
    }
}
