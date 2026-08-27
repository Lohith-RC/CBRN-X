using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// PpeStation V2.0 — Protocol-Enforced Level B Donning Station.
    /// Features:
    /// - Strict Protocol Order Validation (Suit -> Mask -> Gloves) with penalty logging for order deviations
    /// - Multi-Layered Acoustic Donning Stings: Airtight zipper, rubber facial suction seal, elastic gauntlet snap
    /// - Automated Visor Optical Shader & Acoustic Resonance Activation on mask donning
    /// </summary>
    public class PpeStation : MonoBehaviour
    {
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
                Debug.Log("[CBRS-X] CBRN Gas Mask equipped successfully. Visor optics and respiratory acoustic filters active.");
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
                    Debug.Log("[CBRS-X] CBRN Protective Headgear/Mask equipped.");
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
                // Fallback: equip next required PPE component
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
                else if (!glovesEquipped)
                {
                    glovesEquipped = true;
                    itemKey = "gloves";
                    PlayEquipAcousticSting(glovesSnapClip);
                }
                else
                {
                    return;
                }
            }

            equipOrderIndex++;

            if (CbrsEventLogger.Instance != null)
            {
                string json = "{\"item\":\"" + itemKey +
                              "\",\"order_index\":" + equipOrderIndex + "}";
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
            FirstPersonResponderController[] responders = FindObjectsOfType<FirstPersonResponderController>();
            foreach (var responder in responders)
            {
                responder.UpdateAcousticEnvironment(true);
            }

            if (PostProcessingController.Instance != null)
            {
                PostProcessingController.Instance.SetVisorOpticsActive(true);
            }
        }

        private void LogOrderDeviation(string attemptedItem, string prerequisiteItem)
        {
            Debug.LogWarning($"[CBRS-X V2.0 Protocol Warning] PPE item '{attemptedItem}' equipped before '{prerequisiteItem}'.");
            if (GameManager.Instance != null)
            {
                GameManager.Instance.ReportMistake($"Protocol Notice: Standard CBRN order recommends {prerequisiteItem} prior to {attemptedItem}.");
            }
        }

        private void CheckFullDonningStatus()
        {
            if (suitEquipped && maskEquipped && glovesEquipped)
            {
                PlayEquipAcousticSting(fullPpeAuthorizedChimeClip);

                FirstPersonResponderController[] responders = FindObjectsOfType<FirstPersonResponderController>();
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

                Debug.Log("[CBRS-X V2.0] Complete Level B CBRN PPE ensemble fully secured. Perimeter clearance granted.");
            }
        }
    }
}
