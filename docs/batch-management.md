# Batch Management

## Overview

The batch management system allows users to create batches of bills and recharges for efficient payment processing. The enhanced system now includes functionality to view existing batches and add items to them.

## Features

### 1. Cart Management
- Add bills and recharges to cart
- View selected items in a modal
- Remove items from cart
- Clear entire cart

### 2. Create New Batch
- Create new batches with custom names
- Set validation dates
- Automatic batch ID generation
- Support for both bills and recharges

### 3. Existing Batch Management
- View all unpaid batches
- See batch details including:
  - Batch ID
  - Batch name
  - Status (Unpaid, Processing, Paid)
  - Validity status and date
  - Total amount
  - Creation date
- Add cart items to existing batches
- Navigate to batch details

## User Interface

### Batch Cart Icon
The batch cart icon in the header shows:
- Number of items in cart (badge)
- Modal with two tabs:
  1. **Cart Items**: Shows selected bills/recharges
  2. **Existing Batches**: Shows all unpaid batches

### Cart Items Tab
- Table view of selected items
- Remove individual items
- Total amount calculation
- Batch name and validation date inputs
- Create batch button

### Existing Batches Tab
- Table view of all unpaid batches
- Batch status indicators
- Validity status (Valid/Expired)
- Total amount for each batch
- "Add Cart Items" button for each batch

## API Endpoints

### Create Batch
```
POST /api/batch/create
```
Creates a new batch with the provided items.

### Add Items to Existing Batch
```
POST /api/batch/add-items
```
Adds items to an existing batch.

**Request Body:**
```json
{
  "batchId": "string",
  "items": [
    {
      "id": "string",
      "paytype": "number"
    }
  ]
}
```

## Workflow

### Creating a New Batch
1. Add bills/recharges to cart
2. Click batch cart icon
3. Review items in cart tab
4. Enter batch name and validation date
5. Click "Create Batch"

### Adding Items to Existing Batch
1. Add bills/recharges to cart
2. Click batch cart icon
3. Switch to "Existing Batches" tab
4. Click "Add Cart Items" on desired batch
5. Items are added and cart is cleared

## Status Indicators

### Batch Status
- **Unpaid**: Batch is ready for payment
- **Processing**: Batch is being processed
- **Paid**: Batch has been paid

### Validity Status
- **Valid**: Batch is within validity period
- **Expired**: Batch has exceeded validity date

## Error Handling

The system handles various error scenarios:
- Invalid batch IDs
- Non-existent batches
- Database errors
- Network failures
- Validation errors

## Security

- User authentication required
- Batch ownership validation
- Status-based access control
- Audit trail with user tracking
