use thiserror::Error;

/// FloatTask 统一错误类型
#[derive(Error, Debug)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("请求超时")]
    Timeout,

    #[error("网络请求失败: {0}")]
    RequestFailed(String),

    #[error("API 返回格式异常: {0}")]
    ApiFormat(String),

    #[error("未配置大模型 API，请在设置中填写")]
    AiNotConfigured,

    #[error("{0}")]
    Custom(String),
}

pub type Result<T> = std::result::Result<T, AppError>;
