use serde_json::json;
use crate::error::{Result, AppError};

// ====================================================================
// AI 代理 —— OpenAI 兼容 HTTP 客户端
// 支持 DeepSeek / 通义千问 / Ollama 等所有兼容 OpenAI 格式的接口
// ====================================================================

pub struct AiClient {
    client: reqwest::Client,
    api_url: String,
    api_key: String,
    model: String,
}

impl AiClient {
    pub fn new(api_url: &str, api_key: &str, model: &str) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
            api_url: api_url.trim_end_matches('/').to_string(),
            api_key: api_key.to_string(),
            model: model.to_string(),
        }
    }

    pub async fn chat(&self, system_prompt: &str, user_content: &str) -> Result<String> {
        let body = json!({
            "model": &self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.3,
            "max_tokens": 500
        });

        let resp = self
            .client
            .post(&format!("{}/chat/completions", self.api_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::RequestFailed(e.to_string()))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body_text = resp.text().await.unwrap_or_default();
            return Err(AppError::RequestFailed(format!(
                "HTTP {}: {}",
                status, body_text
            )));
        }

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| AppError::ApiFormat(e.to_string()))?;

        json["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AppError::ApiFormat("返回格式异常".to_string()))
    }
}
