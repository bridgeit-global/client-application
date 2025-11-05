# Submeter Readings Management

This document describes the submeter readings management system that allows users to create, read, update, and delete submeter readings for connections.

## Database Schema

The submeter readings are stored in the `portal.submeter_readings` table with the following structure:

```sql
CREATE TABLE portal.submeter_readings (
  connection_id text NOT NULL,
  reading_date date NOT NULL,
  start_reading bigint NOT NULL DEFAULT '0'::bigint,
  end_reading bigint NOT NULL DEFAULT '0'::bigint,
  operator_info jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_at timestamp with time zone NULL,
  updated_by uuid NULL,
  per_day_unit bigint GENERATED ALWAYS AS ((end_reading - start_reading)) STORED NULL,
  CONSTRAINT submeter_readings_pkey PRIMARY KEY (connection_id, reading_date),
  CONSTRAINT submeter_readings_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES portal.connections (id),
  CONSTRAINT submeter_readings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT submeter_readings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users (id)
);
```

## Features

### 1. List View (`/support/meter-reading`)
- Display all submeter readings in a paginated table
- Filter by connection ID and account number
- Sort by various columns
- Summary cards showing total readings, consumption, and active connections
- Export functionality
- Date range filtering

### 2. Create New Reading (`/support/meter-reading/new`)
- Form to add new submeter readings
- Validation for required fields
- JSON operator info support
- Automatic calculation of per_day_unit

### 3. Edit Reading (`/support/meter-reading/[connection_id]/[reading_date]`)
- Edit existing submeter readings
- Update start/end readings and operator info
- Delete functionality
- Form validation

### 4. API Endpoints

#### GET `/api/submeter-readings`
- Fetch all submeter readings with pagination and filtering
- Supports query parameters: `page`, `limit`, `connection_id`, `reading_date_start`, `reading_date_end`, `sort`, `order`

#### POST `/api/submeter-readings`
- Create a new submeter reading
- Validates required fields and unique constraints

#### GET `/api/submeter-readings/[connection_id]/[reading_date]`
- Fetch a specific submeter reading

#### PUT `/api/submeter-readings/[connection_id]/[reading_date]`
- Update a specific submeter reading

#### DELETE `/api/submeter-readings/[connection_id]/[reading_date]`
- Delete a specific submeter reading

## Components

### Types (`types/submeter-readings-type.ts`)
- `SubmeterReading`: Base interface for submeter reading data
- `SubmeterReadingInsert`: Interface for creating new readings
- `SubmeterReadingUpdate`: Interface for updating readings
- `SubmeterReadingWithConnection`: Extended interface with connection details

### Services (`services/submeter-readings.ts`)
- `fetchSubmeterReadings`: Fetch readings with filtering and pagination
- `createSubmeterReading`: Create new reading
- `updateSubmeterReading`: Update existing reading
- `deleteSubmeterReading`: Delete reading
- `getSubmeterReading`: Get specific reading

### UI Components
- `SubmeterReadingsDataTable`: Data table with filtering and sorting
- `SubmeterReadingForm`: Form for creating/editing readings
- Table columns with actions (edit/delete)

### Pages
- `/support/meter-reading`: Main listing page
- `/support/meter-reading/new`: Create new reading
- `/support/meter-reading/[connection_id]/[reading_date]`: Edit reading

## Navigation

The meter reading functionality is accessible through the support sidebar navigation under "Meter Reading".

## Usage

1. **View Readings**: Navigate to `/support/meter-reading` to see all submeter readings
2. **Add Reading**: Click "Add Reading" button to create a new reading
3. **Edit Reading**: Click the edit icon in the actions column
4. **Delete Reading**: Click the delete icon in the actions column (with confirmation)

## Validation

- Connection ID and reading date combination must be unique
- Start and end readings are required
- End reading must be greater than or equal to start reading
- Reading date must be a valid date
- Operator info must be valid JSON (optional)

## Error Handling

- Form validation with user-friendly error messages
- API error handling with toast notifications
- Loading states during operations
- Confirmation dialogs for destructive actions

## Future Enhancements

- Bulk import/export functionality
- Advanced filtering and search
- Reading history charts and analytics
- Integration with billing system
- Mobile-responsive improvements 

# Submeter Readings with Image Upload

## Overview

The submeter readings feature now supports image upload functionality, allowing users to attach meter snapshot images to their readings for better record-keeping and verification.

## Features

### Image Upload
- **Supported Formats**: JPG, PNG, GIF
- **Maximum File Size**: 10MB
- **Storage**: Images are stored in Supabase Storage under the `uploads` bucket
- **File Organization**: Images are organized by connection_id and reading_date

### Form Integration
- **Upload Button**: Camera icon button for easy image selection
- **Preview**: Real-time image preview before submission
- **Validation**: File type and size validation with user-friendly error messages
- **Remove Option**: Ability to remove selected images before submission

### Table Display
- **Image Column**: New "Meter Snapshot" column in the readings table
- **View Button**: Click to view full-size image in a modal
- **No Image State**: Clear indication when no image is attached

## API Endpoints

### Upload Image
```
POST /api/submeter-readings/upload-image
```

**Request Body (FormData)**:
- `file`: Image file
- `connection_id`: Connection identifier
- `reading_date`: Reading date

**Response**:
```json
{
  "url": "https://supabase-storage-url.com/path/to/image.jpg",
  "filename": "meter-snapshots/connection_id/reading_date_timestamp.jpg"
}
```

### Create Reading
```
POST /api/submeter-readings
```

**Request Body**:
```json
{
  "connection_id": "string",
  "reading_date": "YYYY-MM-DD",
  "start_reading": number,
  "end_reading": number,
  "snapshot_url": "string (optional)"
}
```

### Update Reading
```
PUT /api/submeter-readings/{connection_id}/{reading_date}
```

**Request Body**:
```json
{
  "start_reading": number,
  "end_reading": number,
  "snapshot_url": "string (optional)"
}
```

## Database Schema

The `submeter_readings` table now includes:
- `snapshot_url`: TEXT field storing the Supabase Storage URL

## File Storage Structure

Images are stored in Supabase Storage with the following path structure:
```
uploads/meter-snapshots/{connection_id}/{reading_date}_{timestamp}.{extension}
```

Example:
```
uploads/meter-snapshots/ABC123_456789/2024-01-15_2024-01-15T10-30-45-123Z.jpg
```

## Usage

### Creating a New Reading
1. Fill in the reading details (connection, date, readings)
2. Click "Upload Meter Snapshot" to select an image
3. Preview the image and click "Remove" if needed
4. Submit the form - image will be uploaded first, then reading created

### Editing an Existing Reading
1. Existing image will be displayed if available
2. Upload a new image to replace the existing one
3. Remove the image entirely by clicking "Remove"
4. Submit changes

### Viewing Images
1. Navigate to the submeter readings table
2. Click "View" in the "Meter Snapshot" column
3. Image opens in a modal for full-size viewing

## Error Handling

- **File Type Validation**: Only image files are accepted
- **File Size Validation**: Maximum 10MB per image
- **Upload Failures**: Clear error messages for upload issues
- **Image Loading**: Graceful handling of broken image links

## Security

- **File Validation**: Server-side validation of file types and sizes
- **Storage Security**: Images stored in Supabase Storage with proper access controls
- **URL Generation**: Public URLs generated for easy access while maintaining security 