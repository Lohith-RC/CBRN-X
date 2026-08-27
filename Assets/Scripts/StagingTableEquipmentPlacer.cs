using UnityEngine;

namespace CBRSX.Unity
{
    /// <summary>
    /// StagingTableEquipmentPlacer — Ensures the Handheld PID Gas Detector sits directly on the
    /// primary PPE staging table alongside the Hazmat Suit, CBRN Respirator, and Gauntlets.
    /// </summary>
    [DefaultExecutionOrder(-50)]
    public class StagingTableEquipmentPlacer : MonoBehaviour
    {
        [Header("Staging Table Coordinates")]
        public Vector3 tablePosition = new Vector3(-3.30f, 1.02f, -10.95f);
        public Vector3 tableRotation = new Vector3(0f, 45f, 0f);

        private void Awake()
        {
            PlaceGasDetectorOnTable();
        }

        private void Start()
        {
            PlaceGasDetectorOnTable();
        }

        public void PlaceGasDetectorOnTable()
        {
            // Deactivate world gas detector prop(s) so staging table is focused on PPE items (Vest, Mask, Gloves)
            GasDetector[] allDetectors = FindObjectsByType<GasDetector>();
            FirstPersonResponderController player = FirstPersonResponderController.Instance ?? FindAnyObjectByType<FirstPersonResponderController>();

            foreach (var det in allDetectors)
            {
                if (player != null && det.transform.IsChildOf(player.transform))
                {
                    det.UnequipDetector();
                    continue;
                }

                det.gameObject.SetActive(false);
            }

            GameObject worldDetectorGo = GameObject.Find("INT_GasDetector_Spectrometer");
            if (worldDetectorGo != null)
            {
                worldDetectorGo.SetActive(false);
            }

            GameObject dockDetectorGo = GameObject.Find("3M_PID_Gas_Detector");
            if (dockDetectorGo != null)
            {
                dockDetectorGo.SetActive(false);
            }
        }
    }
}
