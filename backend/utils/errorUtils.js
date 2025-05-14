export const handleServerError = (res, error, messagePrefix = "Thao tác") => {
    console.error(`${messagePrefix} Error:`, error);
    res.status(500).json({
        success: false,
        message: `${messagePrefix} thất bại. Vui lòng thử lại.`,
    });
};