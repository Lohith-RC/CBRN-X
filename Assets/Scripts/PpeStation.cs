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

            switch (itemKey)
            {
                case "suit":
                    if (suitEquipped) return;
                    suitEquipped = true;
                    PlayEquipAcousticSting(suitZipperClip);
                    break;

                case "mask":
                    if (maskEquipped) return;
                    if (!suitEquipped)
                    {
                        LogOrderDeviation("mask", "suit");
                    }
                    maskEquipped = true;
                    PlayEquipAcousticSting(maskSuctionSealClip);
                    ActivateVisorOpticsAndAcoustics();
                    break;

                case "gloves":
                    if (glovesEquipped) return;
                    if (!suitEquipped || !maskEquipped)
                    {
                        LogOrderDeviation("gloves", "suit/mask");
                    }
                    glovesEquipped = true;
                    PlayEquipAcousticSting(glovesSnapClip);
                    break;

                default:
                    Debug.LogWarning($"[CBRS-X V2.0] Unknown PPE asset identifier: {itemName}");
                    return;
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
            FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
            if (responder != null)
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

                FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
                if (responder != null)
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
