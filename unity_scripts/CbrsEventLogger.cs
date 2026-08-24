using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace CBRSX.Unity
{
    [Serializable]
    public class LogEventPayloadV2
    {
        public string sessionId;
        public string eventType;
        public string eventData;
        public string timestamp;
    }

    [Serializable]
    public class StartSessionPayloadV2
    {
        public string traineeName;
        public string batchUnit;
        public string scenarioCode;
    }

    [Serializable]
    public class StartSessionResponseV2
    {
        public string sessionId;
        public string traineeId;
        public string scenarioId;
    }

    /// <summary>
    /// CbrsEventLogger V2.1 — Resilient Asynchronous Telemetry Dispatcher.
    /// V2.1 hardening:
    /// - Request timeouts on every UnityWebRequest (no infinite hangs)
    /// - Dead-letter journal: events that exhaust retries persist to disk and flush on recovery
    /// - Session-start retry with exponential backoff before falling back to offline mode
    /// - X-API-Key header support for secured deployments
    /// </summary>
    public class CbrsEventLogger : MonoBehaviour
    {
        public static CbrsEventLogger Instance { get; private set; }

        private const int REQUEST_TIMEOUT_SECONDS = 10;

        /// <summary>
        /// Escapes a string for safe embedding inside hand-built JSON payloads.
        /// Prevents malformed/injectable telemetry when IDs contain quotes or backslashes.
        /// </summary>
        public static string JsonEscape(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            StringBuilder sb = new StringBuilder(value.Length + 8);
            foreach (char c in value)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ') sb.AppendFormat("\\u{0:x4}", (int)c);
                        else sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }

        [Header("Backend REST API Architecture")]
        public string backendBaseUrl = "http://localhost:8080/api";
        [Tooltip("API key sent as X-API-Key. Leave empty when backend runs without CBRSX_API_KEY.")]
        public string apiKey = "";
        public string currentSessionId = "";
        public string traineeName = "Inspector NDRF Responder";
        public string batchUnit = "10th NDRF Battalion";
        public int maxRetryAttempts = 3;
        public float baseRetryDelaySeconds = 1.5f;
        public int sessionStartRetryAttempts = 3;

        private readonly Queue<LogEventPayloadV2> eventQueue = new Queue<LogEventPayloadV2>();
        private bool isDispatchingQueue = false;
        private bool isFlushingJournal = false;

        private string JournalPath =>
            Path.Combine(Application.persistentDataPath, "cbrsx_dead_letter.jsonl");

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
            StartCoroutine(InitializeWithRetries());
        }

        private IEnumerator InitializeWithRetries()
        {
            yield return StartCoroutine(PostStartSessionRoutine());
            FlushDeadLetterJournal();
        }

        public void StartNewSession()
        {
            StartCoroutine(PostStartSessionRoutine());
        }

        public void CompleteSession()
        {
            if (string.IsNullOrEmpty(currentSessionId) || currentSessionId.StartsWith("offline-"))
            {
                Debug.LogWarning("[CBRS-X V2.1] CompleteSession skipped - no live backend session.");
                return;
            }
            StartCoroutine(PostCompleteSessionRoutine());
        }

        public void LogEvent(string eventType, string eventDataJson = "{}")
        {
            LogEventPayloadV2 payload = new LogEventPayloadV2
            {
                sessionId = string.IsNullOrEmpty(currentSessionId) ? "pending-session" : currentSessionId,
                eventType = eventType,
                eventData = eventDataJson,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            };

            eventQueue.Enqueue(payload);

            if (!isDispatchingQueue)
            {
                StartCoroutine(ProcessEventQueueRoutine());
            }
        }

        private IEnumerator ProcessEventQueueRoutine()
        {
            if (isDispatchingQueue) yield break;
            isDispatchingQueue = true;

            while (eventQueue.Count > 0)
            {
                LogEventPayloadV2 currentEvent = eventQueue.Peek();
                if (currentEvent.sessionId == "pending-session" && !string.IsNullOrEmpty(currentSessionId))
                {
                    currentEvent.sessionId = currentSessionId;
                }
                else if (currentEvent.sessionId == "pending-session" && currentSessionId == null)
                {
                    currentEvent.sessionId = "";
                }

                bool dispatchSucceeded = false;
                int attempts = 0;

                while (!dispatchSucceeded && attempts < maxRetryAttempts)
                {
                    attempts++;
                    yield return StartCoroutine(DispatchSingleEventRoutine(currentEvent, (success) => dispatchSucceeded = success));

                    if (!dispatchSucceeded && attempts < maxRetryAttempts)
                    {
                        float delay = baseRetryDelaySeconds * Mathf.Pow(2, attempts - 1);
                        yield return new WaitForSeconds(delay);
                    }
                }

                eventQueue.Dequeue();

                if (!dispatchSucceeded)
                {
                    WriteToJournal(currentEvent);
                    Debug.LogWarning($"[CBRS-X V2.1] Event '{currentEvent.eventType}' exhausted retries - persisted to dead-letter journal.");
                }
            }

            isDispatchingQueue = false;
        }

        private IEnumerator DispatchSingleEventRoutine(LogEventPayloadV2 payload, Action<bool> callback)
        {
            string url = backendBaseUrl + "/events/log";
            string json = JsonUtility.ToJson(payload);

            using (UnityWebRequest request = BuildPostRequest(url, json))
            {
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    callback?.Invoke(true);
                }
                else
                {
                    Debug.LogWarning($"[CBRS-X V2.1] Event '{payload.eventType}' dispatch failed ({request.error}).");
                    callback?.Invoke(false);
                }
            }
        }

        private IEnumerator PostCompleteSessionRoutine()
        {
            string url = $"{backendBaseUrl}/sessions/{UnityWebRequest.EscapeURL(currentSessionId)}/complete";

            using (UnityWebRequest request = UnityWebRequest.Post(url, new WWWForm()))
            {
                request.timeout = REQUEST_TIMEOUT_SECONDS;
                ApplyApiKey(request);

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    Debug.Log("[CBRS-X V2.1] Session finalized with backend scoring engine.");
                }
                else
                {
                    Debug.LogWarning($"[CBRS-X V2.1] Session completion failed ({request.error}).");
                }
            }
        }

        private IEnumerator PostStartSessionRoutine()
        {
            string url = backendBaseUrl + "/sessions/start";
            StartSessionPayloadV2 payload = new StartSessionPayloadV2
            {
                traineeName = this.traineeName,
                batchUnit = this.batchUnit,
                scenarioCode = "CBRN-CHEM-01"
            };

            string json = JsonUtility.ToJson(payload);

            for (int attempt = 1; attempt <= sessionStartRetryAttempts; attempt++)
            {
                using (UnityWebRequest request = BuildPostRequest(url, json))
                {
                    yield return request.SendWebRequest();

                    if (request.result == UnityWebRequest.Result.Success)
                    {
                        StartSessionResponseV2 response = JsonUtility.FromJson<StartSessionResponseV2>(request.downloadHandler.text);
                        currentSessionId = response.sessionId;
                        Debug.Log($"[CBRS-X V2.1] Session established successfully: {currentSessionId}");
                        yield break;
                    }

                    Debug.LogWarning($"[CBRS-X V2.1] Session start attempt {attempt}/{sessionStartRetryAttempts} failed ({request.error}).");

                    if (attempt < sessionStartRetryAttempts)
                    {
                        yield return new WaitForSeconds(baseRetryDelaySeconds * Mathf.Pow(2, attempt - 1));
                    }
                }
            }

            currentSessionId = "offline-" + Guid.NewGuid().ToString().Substring(0, 8);
            Debug.LogWarning($"[CBRS-X V2.1] All session start attempts failed. Operating in local buffered telemetry mode: {currentSessionId}");
        }

        private UnityWebRequest BuildPostRequest(string url, string jsonBody)
        {
            UnityWebRequest request = new UnityWebRequest(url, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            request.timeout = REQUEST_TIMEOUT_SECONDS;
            ApplyApiKey(request);
            return request;
        }

        private void ApplyApiKey(UnityWebRequest request)
        {
            if (!string.IsNullOrEmpty(apiKey))
            {
                request.SetRequestHeader("X-API-Key", apiKey);
            }
        }

        // ── Dead-Letter Journal ──────────────────────────────────────

        private void WriteToJournal(LogEventPayloadV2 payload)
        {
            try
            {
                File.AppendAllText(JournalPath, JsonUtility.ToJson(payload) + Environment.NewLine);
            }
            catch (Exception e)
            {
                Debug.LogError($"[CBRS-X V2.1] Failed to write dead-letter journal: {e.Message}");
            }
        }

        public void FlushDeadLetterJournal()
        {
            if (isFlushingJournal) return;
            if (!File.Exists(JournalPath)) return;
            if (string.IsNullOrEmpty(currentSessionId) || currentSessionId.StartsWith("offline-")) return;

            isFlushingJournal = true;
            StartCoroutine(FlushJournalRoutine());
        }

        private IEnumerator FlushJournalRoutine()
        {
            string[] lines;
            try
            {
                lines = File.ReadAllLines(JournalPath);
            }
            catch (Exception e)
            {
                Debug.LogError($"[CBRS-X V2.1] Failed to read dead-letter journal: {e.Message}");
                isFlushingJournal = false;
                yield break;
            }

            List<LogEventPayloadV2> remaining = new List<LogEventPayloadV2>();

            foreach (string line in lines)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                LogEventPayloadV2 payload;
                try
                {
                    payload = JsonUtility.FromJson<LogEventPayloadV2>(line);
                }
                catch (Exception)
                {
                    continue;
                }

                if (payload.sessionId == "pending-session")
                {
                    payload.sessionId = currentSessionId;
                }

                bool succeeded = false;
                yield return StartCoroutine(DispatchSingleEventRoutine(payload, (ok) => succeeded = ok));

                if (!succeeded)
                {
                    remaining.Add(payload);
                }
            }

            try
            {
                if (remaining.Count > 0)
                {
                    StringBuilder sb = new StringBuilder();
                    foreach (LogEventPayloadV2 payload in remaining)
                    {
                        sb.AppendLine(JsonUtility.ToJson(payload));
                    }
                    File.WriteAllText(JournalPath, sb.ToString());
                    Debug.LogWarning($"[CBRS-X V2.1] {remaining.Count} journal entries still undelivered; retained on disk.");
                }
                else
                {
                    File.Delete(JournalPath);
                    Debug.Log("[CBRS-X V2.1] Dead-letter journal fully flushed and cleared.");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[CBRS-X V2.1] Failed to rewrite dead-letter journal: {e.Message}");
            }

            isFlushingJournal = false;
        }
    }
}
