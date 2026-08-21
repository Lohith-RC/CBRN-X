using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace CBRSX.Unity
{
    [Serializable]
    public class LogEventPayload
    {
        public string sessionId;
        public string eventType;
        public string eventData;
    }

    [Serializable]
    public class StartSessionPayload
    {
        public string traineeName;
        public string batchUnit;
        public string scenarioCode;
    }

    [Serializable]
    public class StartSessionResponse
    {
        public string sessionId;
        public string traineeId;
        public string scenarioId;
    }

    public class CbrsEventLogger : MonoBehaviour
    {
        public static CbrsEventLogger Instance { get; private set; }

        [Header("Backend API Configuration")]
        public string backendBaseUrl = "http://localhost:8080/api";
        public string currentSessionId = "";
        public string traineeName = "Constable NDRF Responder";
        public string batchUnit = "10th NDRF Battalion";

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Start()
        {
            StartNewSession();
        }

        public void StartNewSession()
        {
            StartCoroutine(PostStartSessionRoutine());
        }

        public void LogEvent(string eventType, string eventDataJson = "{}")
        {
            if (string.IsNullOrEmpty(currentSessionId))
            {
                Debug.LogWarning("[CBRS-X] Cannot log event - session ID is empty.");
                return;
            }
            StartCoroutine(PostEventRoutine(eventType, eventDataJson));
        }

        private IEnumerator PostStartSessionRoutine()
        {
            string url = backendBaseUrl + "/sessions/start";
            StartSessionPayload payload = new StartSessionPayload
            {
                traineeName = this.traineeName,
                batchUnit = this.batchUnit,
                scenarioCode = "CBRN-CHEM-01"
            };

            string json = JsonUtility.ToJson(payload);
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    StartSessionResponse response = JsonUtility.FromJson<StartSessionResponse>(request.downloadHandler.text);
                    currentSessionId = response.sessionId;
                    Debug.Log($"[CBRS-X] Session started successfully: {currentSessionId}");
                }
                else
                {
                    Debug.LogError($"[CBRS-X] Failed to start session: {request.error}");
                }
            }
        }

        private IEnumerator PostEventRoutine(string eventType, string eventDataJson)
        {
            string url = backendBaseUrl + "/events/log";
            LogEventPayload payload = new LogEventPayload
            {
                sessionId = currentSessionId,
                eventType = eventType,
                eventData = eventDataJson
            };

            string json = JsonUtility.ToJson(payload);
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log($"[CBRS-X] Event logged: {eventType}");
                }
                else
                {
                    Debug.LogError($"[CBRS-X] Event logging failed: {request.error}");
                }
            }
        }
    }
}
