// UK Business Configuration
// Standard British business practices and settings

export const UK_BUSINESS_CONFIG = {
  // Company Information
  company: {
    name: 'Marina Portal Ltd',
    registeredNumber: '12345678',
    vatNumber: 'GB123456789',
    address: {
      line1: '123 Marina Way',
      line2: 'Portsmouth',
      city: 'Portsmouth',
      county: 'Hampshire',
      postcode: 'PO1 1AA',
      country: 'United Kingdom'
    },
    contact: {
      phone: '+44 23 9283 1234',
      email: 'info@marinaportal.co.uk',
      website: 'https://marinaportal.co.uk'
    },
    compliance: {
      gdprCompliant: true,
      consumerRightsAct: '2015',
      vatAct: '1994',
      dataProtectionAct: '2018'
    }
  },

  // Financial Settings
  financial: {
    currency: 'GBP',
    vatRate: 0.20, // 20% VAT
    corporationTaxRate: 0.25, // 25% Corporation Tax
    vatThreshold: 85000, // £85,000 VAT registration threshold
    financialYearStart: '06-04', // 6th April (UK standard)
    financialYearEnd: '05-04', // 5th April
    paymentTerms: '30 days',
    latePaymentInterest: 0.08, // 8% statutory interest
    earlyPaymentDiscount: 0.025 // 2.5% early payment discount
  },

  // Banking Information
  banking: {
    sortCode: '12-34-56',
    accountNumber: '12345678',
    iban: 'GB29 NWBK 6016 1331 9268 19',
    swift: 'NWBKGB2L',
    bankName: 'National Westminster Bank',
    paymentMethods: [
      {
        id: 'BACS',
        name: 'BACS/CHAPS',
        description: 'Bank transfer (1-3 business days)',
        fee: 0.00
      },
      {
        id: 'DIRECT_DEBIT',
        name: 'Direct Debit',
        description: 'Automated payment collection',
        fee: 0.00
      },
      {
        id: 'CARD',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, American Express',
        fee: 0.025 // 2.5% card processing fee
      },
      {
        id: 'CHEQUE',
        name: 'Cheque',
        description: 'Paper cheque payment',
        fee: 0.00
      }
    ]
  },

  // Regional Settings
  regional: {
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    currency: 'GBP',
    language: 'en-GB',
    locale: 'en-GB',
    weekStartsOn: 1, // Monday (UK standard)
    country: 'United Kingdom',
    measurementSystem: 'metric',
    distanceUnit: 'miles', // Keep miles for road distances
    volumeUnit: 'pints' // Keep pints for drinks
  },

  // Business Hours
  businessHours: {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '17:00' },
    saturday: { start: '09:00', end: '13:00' },
    sunday: { start: '10:00', end: '16:00' },
    timezone: 'Europe/London'
  },

  // Tax Configuration
  tax: {
    vat: {
      rate: 0.20,
      threshold: 85000,
      registrationRequired: true,
      returnFrequency: 'quarterly'
    },
    corporationTax: {
      rate: 0.25,
      paymentDeadline: '9 months and 1 day after year end'
    },
    incomeTax: {
      personalAllowance: 12570,
      basicRate: { threshold: 50270, rate: 0.20 },
      higherRate: { threshold: 125140, rate: 0.40 },
      additionalRate: { threshold: 125140, rate: 0.45 }
    }
  },

  // Compliance Requirements
  compliance: {
    gdpr: {
      dataRetentionPeriod: '7 years',
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true
    },
    financial: {
      auditThreshold: '£10.2 million turnover',
      recordKeeping: '6 years',
      vatRecords: '6 years',
      payrollRecords: '3 years'
    },
    healthAndSafety: {
      riskAssessmentRequired: true,
      firstAidRequired: true,
      fireSafetyRequired: true
    }
  }
}

// Export individual sections for easy access
export const {
  company,
  financial,
  banking,
  regional,
  businessHours,
  tax,
  compliance
} = UK_BUSINESS_CONFIG

// Export default configuration
export default UK_BUSINESS_CONFIG
