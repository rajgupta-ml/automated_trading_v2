export enum ErrorMessages {
    // --- General / System Errors ---
    INTERNAL_SERVER_ERROR = 'An internal system error occurred. Please try again or contact support if the issue persists.',
    SERVICE_UNAVAILABLE = 'Trading services are temporarily unavailable. Please try again in a few minutes.',
    NETWORK_DISCONNECTION = 'Lost connection to the trading server. Please check your internet and reconnect.',
    API_LIMIT_EXCEEDED = 'API rate limit exceeded. Please wait a moment and try again.',
    UNAUTHORIZED_ACCESS = 'Authentication failed. Please verify your credentials and try again.',
    FORBIDDEN_ACTION = 'You do not have permission to perform this action. Contact your administrator if you believe this is an error.',
    GENERIC_CLIENT_ERROR = 'An unexpected client-side error occurred. Please refresh the page.',
    GENERIC_ERROR = 'An unknown error occurred.', // Fallback for truly unhandled cases

    // --- Authentication & User Management Errors ---
    USERNAME_REQUIRED = 'Username is required.',
    PASSWORD_REQUIRED = 'Password is required.',
    USERNAME_AND_PASSWORD_REQUIRED = 'Username and password are required.',
    INVALID_CREDENTIALS = 'Invalid username or password.',
    USER_NOT_FOUND = 'User not found.',
    TOKEN_REQUIRED = 'Authentication token is missing.',
    TOKEN_INVALIDATED = 'Your session has expired or the token is invalid. Please log in again.',
    UPDATE_FIELDS_REQUIRED = 'At least one field (password, API key, API secret, or redirect URI) is required for update.',
    USERNAME_ALREADY_EXISTS = 'This username is already taken. Please choose a different one.', // Added for duplicate key

    // --- MongoDB Specific Errors ---
    DATABASE_CONNECTION_ERROR = 'Failed to connect to the database. Please try again later or contact support.',
    DATABASE_OPERATION_FAILED = 'A database operation failed unexpectedly. Please try again.',
    INVALID_DATA_FORMAT = 'The provided data is in an invalid format. Please check your input.',
    VALIDATION_ERROR = 'Validation failed: {details}. Please check your input data.', // For Mongoose validation errors
    RESOURCE_ALREADY_EXISTS = 'The resource you are trying to create already exists.', // General duplicate entry
    RESOURCE_NOT_FOUND_DB = 'The requested resource was not found in the database.', // More specific for DB lookups

    // --- Trading Logic / Order Related Errors ---
    INVALID_ORDER_PARAMETERS = 'Invalid order parameters. Please check quantity, price, and type.',
    INSUFFICIENT_FUNDS = 'Insufficient funds to place this order. Please check your available balance.',
    INSUFFICIENT_HOLDINGS = 'Insufficient holdings of the instrument to place this sell order.',
    INVALID_INSTRUMENT = 'The specified trading instrument is invalid or not supported.',
    ORDER_REJECTED_EXCHANGE = 'Order rejected by exchange: {reason}. Please review and resubmit.', // Placeholder for dynamic reason
    ORDER_ALREADY_EXISTS = 'An order with these parameters already exists or is being processed.',
    ORDER_NOT_FOUND = 'The specified order was not found. It may have been filled, canceled, or never existed.',
    ORDER_CANCELLATION_FAILED = 'Failed to cancel the order. It might already be filled or in an uncancelable state.',
    ORDER_MODIFICATION_FAILED = 'Failed to modify the order. It might already be filled or in an unmodifiable state.',
    PRICE_OUT_OF_RANGE = 'The specified price is outside the allowed trading range for this instrument.',
    QUANTITY_MIN_MAX_VIOLATION = 'Order quantity is outside the allowed minimum or maximum for this instrument.',
    ACCOUNT_FROZEN_OR_SUSPENDED = 'Your trading account is frozen or suspended. Please contact support.',
    TRADING_HOURS_VIOLATION = 'Trading for this instrument is currently closed. Please check market hours.',
    DUPLICATE_TRADE_ID = 'A trade with this unique ID has already been processed. Possible retry attempt.',
    MARGIN_CALL = 'Margin call initiated. Your account requires additional funds to maintain positions.',

    // --- Configuration / Setup Errors ---
    INVALID_API_KEY = 'The provided API key is invalid or expired. Please update your API key.',
    BROKER_CONNECTION_FAILED = 'Failed to connect to the broker. Please check API key and network.',
    STRATEGY_CONFIGURATION_ERROR = 'Strategy configuration error: {details}. Please review your strategy settings.', // Placeholder
    MISSING_REQUIRED_SETTING = 'Missing a required setting: {settingName}. Please complete your profile/configuration.', // Placeholder

    // --- Data / Market Data Errors ---
    MARKET_DATA_UNAVAILABLE = 'Market data for this instrument is currently unavailable. Please try again later.',
    INVALID_DATE_RANGE = 'Invalid date range specified for historical data query.',
    SUBSCRIPTION_FAILED = 'Failed to subscribe to market data for instrument: {instrument}.',
    DATA_FEED_ERROR = 'Error receiving data from market feed. Data may be stale.',
}
export enum SuccessMessages {
    OPERATION_SUCCESSFUL = 'Operation completed successfully.',
    RESOURCE_CREATED = 'Resource created successfully.',
    USER_SIGNED_UP = 'User account created successfully.',
    LOGIN_SUCCESSFUL = 'Login successful.',
    USER_UPDATED = 'User profile updated successfully.',
    USER_DELETED = 'User account deleted successfully.',
    LOGOUT_SUCCESSFUL = 'Logged out successfully.',
    ORDER_PLACED = 'Order successfully placed.',
    ORDER_MODIFIED = 'Order successfully modified.',
    ORDER_CANCELED = 'Order successfully canceled.',
    STRATEGY_STARTED = 'Trading strategy started successfully.',
    ACCOUNT_FUNDED = 'Account funded successfully.',
    HEALTH_CHECK_OK = 'Service is operational.',
}
