using UnityEngine;

namespace CBRSX.Unity
{
    public class PpeStation : MonoBehaviour
    {
        [Header("PPE Donning Checklist")]
        public bool maskEquipped = false;
        public bool suitEquipped = false;
        public bool glovesEquipped = false;

        public void EquipItem(string itemName)
        {
            switch (itemName.ToLower())
            {
                case "mask":
                    maskEquipped = true;
                    if (CbrsEventLogger.Instance != null)
                        CbrsEventLogger.Instance.LogEvent("ppe_item_equipped", "{\"item\":\"mask\"}");
                    break;

                case "suit":
                    suitEquipped = true;
                    if (CbrsEventLogger.Instance != null)
                        CbrsEventLogger.Instance.LogEvent("ppe_item_equipped", "{\"item\":\"suit\"}");
                    break;

                case "gloves":
                    glovesEquipped = true;
                    if (CbrsEventLogger.Instance != null)
                        CbrsEventLogger.Instance.LogEvent("ppe_item_equipped", "{\"item\":\"gloves\"}");
                    break;
            }

            CheckFullDonning();
        }

        private void CheckFullDonning()
        {
            if (maskEquipped && suitEquipped && glovesEquipped)
            {
                Debug.Log("[CBRS-X] Complete CBRN PPE Donned.");
                FirstPersonResponderController responder = FindObjectOfType<FirstPersonResponderController>();
                if (responder != null)
                {
                    responder.hasFullPpe = true;
                }

                if (CbrsEventLogger.Instance != null)
                {
                    CbrsEventLogger.Instance.LogEvent("ppe_donning_completed", "{\"status\":\"complete\"}");
                }
            }
        }
    }
}
