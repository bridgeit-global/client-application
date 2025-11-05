# station Management Test Cases

## General Page Layout
1. **Page Header Check**
   - Navigate to the station management page
   - Verify the page displays "Manage Your Stations and Connections" as the title
   - Verify "All Stations and Connections" appears as the description

## Stations Table Section
1. **Basic Table Display**
   - Verify the Stations table is visible
   - Check if the table shows a separator line above it
   - Confirm the active count is displayed correctly

2. **Filtering Stations**
   - Click on any filter option in the table
   - Enter/select filter criteria
   - Verify the table updates to show only matching results
   - Clear the filter and verify all stations are shown again

## Connection Tables

### Postpaid Connections
1. **Table Visibility**
   - Verify the Postpaid connections table is visible
   - Check if the separator line appears above the table
   - Confirm the active count shows correct number

2. **Data Filtering**
   - Use the filter options in the table
   - Enter search criteria
   - Verify filtered results show only postpaid connections
   - Clear filters and check if all postpaid connections return

### Prepaid Connections
1. **Table Visibility**
   - Verify the Prepaid connections table is visible
   - Check for the separator line above the table
   - Confirm the active count displays correctly

2. **Data Filtering**
   - Apply filters to the prepaid table
   - Enter search criteria
   - Verify results show only prepaid connections
   - Clear filters and verify all prepaid connections return

### Submeter Connections
1. **Table Visibility**
   - Verify the Submeter connections table is visible
   - Check for the separator line above the table
   - Confirm the active count shows correct number

2. **Data Filtering**
   - Use the filter options in the submeter table
   - Enter search criteria
   - Verify filtered results show only submeter connections
   - Clear filters and check if all submeter connections return

## General Functionality
1. **Page Loading**
   - Verify all tables load without errors
   - Check if loading indicators appear while data is being fetched
   - Confirm the page is responsive on different screen sizes

2. **Data Accuracy**
   - Verify total counts match the displayed number of records
   - Check if active counts are consistent with the data shown
   - Confirm pagination works correctly in all tables

## Error Scenarios
1. **Invalid Filters**
   - Enter invalid filter criteria
   - Verify appropriate error messages are shown
   - Check if the system handles invalid JSON in search parameters

2. **Network Issues**
   - Test page behavior when network is slow
   - Verify appropriate error messages appear if data fetch fails
   - Check if retry mechanisms work properly

## Notes for Testers
- Document any issues found with screenshots
- Note down the browser and device used for testing
- Record the time taken for data to load in different scenarios
- Pay attention to any UI inconsistencies across different tables 