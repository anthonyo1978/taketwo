import type { Transaction, TransactionCreateInput } from 'types/transaction'
import { createTransaction } from './transaction-storage'
import { getResidentsFromStorage } from './resident-storage'

// Generate some sample transactions for testing
export function generateSampleTransactions(): void {
  const residents = getResidentsFromStorage()
  
  if (residents.length === 0) {
    console.log('No residents found, skipping sample transaction generation')
    return
  }

  const sampleTransactions: TransactionCreateInput[] = []
  const serviceTypes = [
    'SDA_RENT',
    'SIL_SUPPORT', 
    'CORE_SUPPORT',
    'TRANSPORT',
    'THERAPY'
  ]

  const descriptions = [
    'Daily accommodation support',
    'Personal care assistance',
    'Community access support',
    'Transportation to medical appointments',
    'Occupational therapy session',
    'Weekly cleaning service',
    'Meal preparation assistance',
    'Medication management',
    'Social and community participation',
    'Allied health consultation'
  ]

  residents.forEach(resident => {
    const activeContracts = resident.fundingInformation.filter(c => c.contractStatus === 'Active')
    
    if (activeContracts.length > 0) {
      // Generate 3-8 transactions per resident
      const transactionCount = Math.floor(Math.random() * 6) + 3
      
      for (let i = 0; i < transactionCount; i++) {
        const contract = activeContracts[Math.floor(Math.random() * activeContracts.length)]
        const serviceCode = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
        const description = descriptions[Math.floor(Math.random() * descriptions.length)]
        
        // Generate random dates in the last 60 days
        const daysAgo = Math.floor(Math.random() * 60)
        const occurredAt = new Date()
        occurredAt.setDate(occurredAt.getDate() - daysAgo)
        
        const quantity = Math.floor(Math.random() * 8) + 1 // 1-8 hours/units
        const baseUnitPrice = serviceCode === 'SDA_RENT' ? 50 : 
                             serviceCode === 'SIL_SUPPORT' ? 65 :
                             serviceCode === 'THERAPY' ? 120 :
                             serviceCode === 'TRANSPORT' ? 25 : 45
        
        const unitPrice = baseUnitPrice + (Math.random() * 20 - 10) // Add some variation
        const amount = Math.round(quantity * unitPrice * 100) / 100 // Round to 2 decimal places
        
        const transaction: TransactionCreateInput = {
          residentId: resident.id,
          contractId: contract.id,
          occurredAt,
          serviceCode,
          description,
          quantity,
          unitPrice: Math.round(unitPrice * 100) / 100,
          amount,
          note: i % 3 === 0 ? `Generated sample transaction #${i + 1}` : undefined
        }
        
        sampleTransactions.push(transaction)
      }
    }
  })

  // Create the transactions
  let createdCount = 0
  let postedCount = 0
  
  sampleTransactions.forEach((txInput, index) => {
    try {
      const transaction = createTransaction(txInput, 'system')
      createdCount++
      
      // Post about 70% of transactions randomly
      if (Math.random() < 0.7) {
        try {
          // Import the postTransaction function
          const { postTransaction } = require('./transaction-storage')
          postTransaction(transaction.id, 'system')
          postedCount++
        } catch (postError) {
          console.warn(`Failed to post transaction ${transaction.id}:`, postError)
        }
      }
    } catch (error) {
      console.warn(`Failed to create sample transaction ${index}:`, error)
    }
  })

  console.log(`Generated ${createdCount} sample transactions (${postedCount} posted, ${createdCount - postedCount} draft)`)
}

// Function to clear all transactions (useful for testing)
export function clearAllTransactions(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ndis_transactions')
    console.log('All transactions cleared')
  }
}