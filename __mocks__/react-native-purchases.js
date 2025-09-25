// Mock for react-native-purchases
const mockCustomerInfo = {
  originalAppUserId: 'test-user-id',
  entitlements: {
    active: {},
    all: {},
  },
  allPurchaseDates: {},
  latestExpirationDate: null,
  originalPurchaseDate: null,
};

const mockOffering = {
  identifier: 'default',
  serverDescription: 'Default offering',
  availablePackages: [
    {
      identifier: 'monthly',
      product: {
        identifier: 'peer_learning_hub_monthly',
        price: 9.99,
        currencyCode: 'USD',
        subscriptionPeriod: {
          numberOfUnits: 1,
          unit: 'MONTH',
        },
      },
    },
    {
      identifier: 'yearly',
      product: {
        identifier: 'peer_learning_hub_yearly',
        price: 99.99,
        currencyCode: 'USD',
        subscriptionPeriod: {
          numberOfUnits: 1,
          unit: 'YEAR',
        },
      },
    },
  ],
};

const Purchases = {
  configure: jest.fn().mockResolvedValue(undefined),
  logIn: jest.fn().mockResolvedValue(mockCustomerInfo),
  logOut: jest.fn().mockResolvedValue(mockCustomerInfo),
  getCustomerInfo: jest.fn().mockResolvedValue(mockCustomerInfo),
  getOfferings: jest.fn().mockResolvedValue({
    current: mockOffering,
    all: {
      default: mockOffering,
    },
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: {
      ...mockCustomerInfo,
      entitlements: {
        active: {
          premium_membership: {
            productIdentifier: 'peer_learning_hub_monthly',
            latestPurchaseDate: new Date(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            willRenew: true,
          },
        },
      },
    },
    productIdentifier: 'peer_learning_hub_monthly',
  }),
  restorePurchases: jest.fn().mockResolvedValue(mockCustomerInfo),
  setAttributes: jest.fn().mockResolvedValue(undefined),
  setLogLevel: jest.fn(),
  
  // Constants
  LOG_LEVEL: {
    VERBOSE: 'VERBOSE',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
  },
  
  // Error types
  PURCHASES_ERROR_CODE: {
    UNKNOWN_ERROR: 0,
    PURCHASE_CANCELLED_ERROR: 1,
    STORE_PROBLEM_ERROR: 2,
    PURCHASE_NOT_ALLOWED_ERROR: 3,
    PURCHASE_INVALID_ERROR: 4,
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 5,
    PRODUCT_ALREADY_PURCHASED_ERROR: 6,
    RECEIPT_ALREADY_IN_USE_ERROR: 7,
    INVALID_RECEIPT_ERROR: 8,
    MISSING_RECEIPT_FILE_ERROR: 9,
    NETWORK_ERROR: 10,
    INVALID_CREDENTIALS_ERROR: 11,
    UNEXPECTED_BACKEND_RESPONSE_ERROR: 12,
    RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR: 13,
    INVALID_APP_USER_ID_ERROR: 14,
    OPERATION_ALREADY_IN_PROGRESS_ERROR: 15,
    UNKNOWN_BACKEND_ERROR: 16,
    INVALID_APPLE_SUBSCRIPTION_KEY_ERROR: 17,
    INELIGIBLE_ERROR: 18,
    INSUFFICIENT_PERMISSIONS_ERROR: 19,
    PAYMENT_PENDING_ERROR: 20,
    INVALID_SUBSCRIBER_ATTRIBUTES_ERROR: 21,
    LOG_OUT_CALLED_WITH_ANONYMOUS_USER_ERROR: 22,
    CONFIGURATION_ERROR: 23,
    UNSUPPORTED_ERROR: 24,
    EMPTY_SUBSCRIBER_ATTRIBUTES_ERROR: 25,
    PRODUCT_DISCOUNT_MISSING_IDENTIFIER_ERROR: 26,
    PRODUCT_DISCOUNT_MISSING_SIGNATURE_ERROR: 27,
    PRODUCT_DISCOUNT_MISSING_KEY_IDENTIFIER_ERROR: 28,
    PRODUCT_DISCOUNT_MISSING_NONCE_ERROR: 29,
    PRODUCT_DISCOUNT_MISSING_TIMESTAMP_ERROR: 30,
    CUSTOMER_INFO_ERROR: 31,
    SYSTEM_INFO_ERROR: 32,
    BEGIN_REFUND_REQUEST_ERROR: 33,
  },
};

// Mock error class
class PurchasesError extends Error {
  constructor(message, code, userCancelled = false) {
    super(message);
    this.name = 'PurchasesError';
    this.code = code;
    this.userCancelled = userCancelled;
  }
}

module.exports = {
  default: Purchases,
  ...Purchases,
  PurchasesError,
};