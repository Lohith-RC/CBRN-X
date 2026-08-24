using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace CBRSX.Unity
{
    /// <summary>
    /// HudManager V2.0 — Tactical Military HUD & Operational Telemetry Display.
    /// Features:
    /// - Dynamic Tactical Compass Rose displaying real-time cardinal headings (0-360 deg)
    /// - Animated Level B PPE Checklist with pulsing checkmark confirmation transitions
    /// - Tactical Mission Prompt Ribbon with animated typewritten prompt updates
    /// - Warning Toast Popups & Achievement Banners with smooth alpha interpolation
    /// </summary>
    public class HudManager : MonoBehaviour
    {
        [Header("Tactical Mission Objective Ribbon")]
        public TextMeshProUGUI stagePromptText;

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

        // Internal State
        private float mistakeTimer = 0f;
        private float achievementTimer = 0f;
        private GameManager gm;
        private Camera mainCam;

        private void Start()
        {
            gm = GameManager.Instance;
            mainCam = Camera.main;

            SetPpeIconState(suitIcon, suitCheckmark, false);
            SetPpeIconState(maskIcon, maskCheckmark, false);
            SetPpeIconState(glovesIcon, glovesCheckmark, false);

            if (mistakeToastRoot != null) mistakeToastRoot.SetActive(false);
            if (achievementBannerRoot != null) achievementBannerRoot.SetActive(false);

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
        }

        private void HandlePpeItemEquipped(string itemKey)
        {
            switch (itemKey.ToLower())
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
            stagePromptText.text = gm.GetStageObjectiveText();
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
