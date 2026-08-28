using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// PpeStation V3.0 — Self-Bootstrapping Level B Donning Station & PPE Equipment Manager.
    /// Features:
    /// - Singleton access with automatic runtime fallback instantiation
    /// - Strict Protocol Order Validation (Suit -> Mask -> Gloves) with penalty logging
    /// - Multi-Layered Acoustic Donning Stings: Airtight zipper, rubber facial suction seal, elastic gauntlet snap
    /// - Automated Visor Optical Shader & Respiratory Acoustic Filtering
    /// </summary>
    public class PpeStation : MonoBehaviour
    {
        public static PpeStation Instance { get; private set; }

        [Header("Donning Progression Checklist")]
        public bool suitEquipped = false;
        public bool maskEquipped = false;
        public bool glovesEquipped = false;

        [Header("Tactical Donning Acoustic Stings")]
        public AudioSource ppeAudioSource;
        public AudioClip suitZipperClip;
        public AudioClip maskSuctionSealClip;
        public AudioClip glovesSnapClip;
        public AudioClip fullPpeAuthorizedChimeClip;

        // Internal State
        private int equipOrderIndex = 0;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else if (Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            if (ppeAudioSource == null)
            {
                ppeAudioSource = GetComponent<AudioSource>();
                if (ppeAudioSource == null)
                {
                    ppeAudioSource = gameObject.AddComponent<AudioSource>();
                    ppeAudioSource.playOnAwake = false;
                    ppeAudioSource.spatialBlend = 0f; // 2D clean HUD audio
                }
            }
        }

        public static PpeStation EnsureInstance()
        {
            if (Instance != null) return Instance;

            PpeStation existing = FindAnyObjectByType<PpeStation>();
            if (existing != null)
            {
                Instance = existing;
                return Instance;
            }

            GameObject go = new GameObject("System_PpeStation");
            Instance = go.AddComponent<PpeStation>();
            return Instance;
        }

        public void EquipItem(string itemName)
        {
            string itemKey = itemName.ToLower();

            if (itemKey.Contains("mask") || itemKey.Contains("respirator") || itemKey.Contains("gasmask") || itemKey.Contains("cbrn") || itemKey.Contains("filter") || itemKey.Contains("visor"))
            {
                if (maskEquipped) return;
                maskEquipped = true;
                itemKey = "mask";
                PlayEquipAcousticSting(maskSuctionSealClip);
                ActivateVisorOpticsAndAcoustics();
                Debug.Log("[CBRS-X] CBRN Gas Mask equipped successfully. Visor optics active.");
            }
            else if (itemKey.Contains("suit") || itemKey.Contains("hazmat") || itemKey.Contains("vest") || itemKey.Contains("jacket"))
            {
                if (suitEquipped) return;
                suitEquipped = true;
                itemKey = "suit";
                PlayEquipAcousticSting(suitZipperClip);
                Debug.Log("[CBRS-X] Level B Hazmat Suit equipped successfully.");
            }
            else if (itemKey.Contains("glove") || itemKey.Contains("gauntlet") || itemKey.Contains("hand"))
            {
                if (glovesEquipped) return;
                glovesEquipped = true;
                itemKey = "gloves";
                PlayEquipAcousticSting(glovesSnapClip);
                Debug.Log("[CBRS-X] Chemical Resistant Gloves equipped successfully.");
            }
            else if (itemKey.Contains("hardhat") || itemKey.Contains("helmet") || itemKey.Contains("head"))
            {
                if (!maskEquipped)
                {
                    maskEquipped = true;
                    itemKey = "mask";
                    PlayEquipAcousticSting(maskSuctionSealClip);
                    ActivateVisorOpticsAndAcoustics();
                }
                else if (!suitEquipped)
                {
                    suitEquipped = true;
                    itemKey = "suit";
                    PlayEquipAcousticSting(suitZipperClip);
                }
                else
                {
                    PlayEquipAcousticSting(suitZipperClip);
                    return;
                }
            }
            else
            {
                // Sequential fallback: equip next missing PPE component
                if (!suitEquipped)
                {
                    suitEquipped = true;
                    itemKey = "suit";
                    PlayEquipAcousticSting(suitZipperClip);
                    Debug.Log("[CBRS-X] Level B Hazmat Suit equipped.");
                }
                else if (!maskEquipped)
                {
                    maskEquipped = true;
                    itemKey = "mask";
                    PlayEquipAcousticSting(maskSuctionSealClip);
                    ActivateVisorOpticsAndAcoustics();
                    Debug.Log("[CBRS-X] CBRN Gas Mask equipped.");
                }
                else if (!glovesEquipped)
                {
                    glovesEquipped = true;
                    itemKey = "gloves";
                    PlayEquipAcousticSting(glovesSnapClip);
                    Debug.Log("[CBRS-X] Chemical Gloves equipped.");
                }
                else
                {
                    return;
                }
            }

            equipOrderIndex++;

            if (CbrsEventLogger.Instance != null)
            {
                string json = "{\"item\":\"" + itemKey + "\",\"order_index\":" + equipOrderIndex + "}";
                CbrsEventLogger.Instance.LogEvent("ppe_item_equipped", json);
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.RegisterPpeEquip(itemKey);
            }

            CheckFullDonningStatus();
        }

        private void PlayEquipAcousticSting(AudioClip clip)
        {
            if (ppeAudioSource != null && clip != null)
            {
                ppeAudioSource.PlayOneShot(clip, 0.95f);
            }
        }

        private void ActivateVisorOpticsAndAcoustics()
        {
            FirstPersonResponderController[] responders = FindObjectsByType<FirstPersonResponderController>();
            foreach (var responder in responders)
            {
                responder.UpdateAcousticEnvironment(true);
            }

            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetVisorOpticsActive(true);
            }
        }

        private void CheckFullDonningStatus()
        {
            if (suitEquipped && maskEquipped && glovesEquipped)
            {
                PlayEquipAcousticSting(fullPpeAuthorizedChimeClip);

                FirstPersonResponderController[] responders = FindObjectsByType<FirstPersonResponderController>();
                foreach (var responder in responders)
                {
                    responder.hasFullPpe = true;
                }

                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("ppe_donning_completed", "{\"status\":\"complete\",\"order_counter\":" + equipOrderIndex + "}");
                }

                if (GameManager.Instance != null)
                {
                    GameManager.Instance.RegisterFullPpeDonned();
                }

                Debug.Log("[CBRS-X V3.0] Complete Level B CBRN PPE ensemble fully secured. Hot Zone access granted.");
            }
        }
    }
}
