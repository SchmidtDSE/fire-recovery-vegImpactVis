# Fire Recovery Vegetation Impact Visualization

A D3.js-based Marimekko chart visualization for displaying fire severity across different vegetation types. This visualization helps to understand the distribution of burn severity across different vegetation types.

## Overview

This code provides an interactive data visualization that displays fire severity data across different vegetation types using a Marimekko chart. The visualization offers two viewing modes:

- **Condensed View**: Shows a simplified view of the data with only the active severity segments visible. This should be our default/load view.
- **Expanded View**: Shows all severity data for all vegetation types, with the data pertaining to the related severity in each row shown in full opacity.

The visualization includes interactive features such as:
- Tooltips showing detailed information on hover
- Detailed side panel view on click with comparative charts
- Toggle between condensed and expanded views

## Integration Guide

How to integrate this visualization into the frontend

### Prerequisites

- D3.js v7 (loaded via CDN in the current implementation)

### Project Structure

```
fire-recovery-vegImpactVis/
├── data/                 # Sample data files (for development)
│   └── veg_fire_matrix_eureka.csv
├── src/
│   ├── index.html        # Main HTML file
│   ├── marimekko.js      # Visualization code
│   └── styles.css        # Styling for the visualization
└── README.md             # This documentation
```
Note that the .csv file is ignored and not uploaded here. I can email it seperately for reference. See bottom of readme for example of headers and expected data types.

### Basic Integration Steps

1. Include the required JavaScript and CSS files
2. Create a container element for the visualization
3. Modify the data loading mechanism to use API
4. Initialize the visualization with the data

### Detailed Integration Instructions

#### 1. Include Required Files

Add the following to your HTML:

```html
<!-- D3.js library -->
<script src="https://d3js.org/d3.v7.min.js"></script>
<!-- Visualization JavaScript -->
<script src="path/to/marimekko.js"></script>
<!-- Visualization CSS -->
<link rel="stylesheet" href="path/to/styles.css">
```

#### 2. Create Container Element

Add a container div where the visualization will be rendered:

```html
<div id="visualization-container"></div>
```

#### 3. Modify Data Loading for API Integration

The current implementation loads data from a local CSV file. To use an API instead, modify the data loading section in `marimekko.js`. 
Please take the below as a reference, but utilize what is being done elsewhere in the frontend to handle consistently. 


```javascript
// Current implementation (using local CSV):
d3.csv("../data/veg_fire_matrix_eureka.csv").then(function(csvData) {
    // Initial chart creation with condensed view
    createRotatedMarimekkoChart(csvData, viewMode);
    
    // Add toggle functionality...
});

// Modified implementation (using API):
function fetchDataFromAPI() {
    // Replace with your API endpoint
    const apiUrl = 'https://your-api-endpoint.com/fire-vegetation-data';
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Process API data if needed to match the expected format
            const processedData = processApiData(data);
            
            // Initial chart creation with condensed view
            createRotatedMarimekkoChart(processedData, viewMode);
            
            // Add toggle functionality
            d3.select('#view-toggle').on('click', function() {
                // Toggle view mode
                viewMode = viewMode === 'condensed' ? 'expanded' : 'condensed';
                
                // Update button text
                d3.select(this).text(viewMode === 'condensed' ? 'Show Expanded View' : 'Show Condensed View');
                
                // Clear existing visualization
                container.select('svg').remove();
                
                // Redraw with new mode
                createRotatedMarimekkoChart(processedData, viewMode);
            });
        })
        .catch(error => {
            console.error("Error fetching data from API:", error);
        });
}

// Function to process API data to match expected CSV format if needed
function processApiData(apiData) {
    // Process the API data to match the format expected by createRotatedMarimekkoChart
    // This will depend on your API response structure
    return apiData;
}

// Call the function to load data when the page loads
document.addEventListener('DOMContentLoaded', fetchDataFromAPI);
```

### Expected Data Format

The visualization expects data in the following format:


| Field | Description | Type |
|-------|-------------|------|
| vegetation_classification | Name of the vegetation type | string |
| color | Hex color code for this vegetation type | string |
| unburned_ha | Hectares of unburned area for this vegetation | number |
| low_ha | Hectares of low severity burn for this vegetation | number |
| moderate_ha | Hectares of moderate severity burn for this vegetation | number |
| high_ha | Hectares of high severity burn for this vegetation | number |
| total_ha | Total hectares for this vegetation type | number |
| unburned_percent | Percentage of unburned area | number |
| low_percent | Percentage of low severity burn | number |
| moderate_percent | Percentage of moderate severity burn | number |
| high_percent | Percentage of high severity burn | number |
| total_percent | Percentage of total area this vegetation represents | number |

Additional fields in the CSV are for metadata and are not used directly in the visualization.

### Key actions that need to happen when generating this data:
1. The color needs to match the color on the vegetation map
2. The severity levels (low/moderate/high) should have a default value with the option to update based on user input
- currently the description of the severity levels on the visualization are hardcoded, these should be dynamic to read in either the default asigned values or the user's specified levels


### API Response Example

Your API should return data in this format:

```json
[
  {
    "vegetation_classification": "Red Brome - Mediterranean Grass Semi-Natural Herbaceous Stands",
    "color": "#A5D1C8",
    "unburned_ha": 2.91783514,
    "low_ha": 1.355689068,
    "moderate_ha": 0.491276296,
    "high_ha": 0.000206481,
    "total_ha": 4.765006984,
    "unburned_percent": 61.23,
    "low_percent": 28.45,
    "moderate_percent": 10.31,
    "high_percent": 0,
    "total_percent": 4.87
  },
  // Additional vegetation entries...
]
```
