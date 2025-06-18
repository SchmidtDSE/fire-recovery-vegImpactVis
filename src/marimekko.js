// Rotated D3 Marimekko Chart Implementation with detailed segments

document.addEventListener('DOMContentLoaded', () => {
    if (typeof d3 === 'undefined') {
        console.error('D3 library not loaded!');
        return;
    }
    
    console.log('D3 version:', d3.version);
    
    // Load CSV data and initialize chart
    d3.csv("../data/vegetation_data.csv").then(function(csvData) {
        createRotatedMarimekkoChart(csvData);
    }).catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });
});

function createRotatedMarimekkoChart(csvData) {
    function showTooltip(x, y, name, percent, hectares, severity) {
    // Remove any existing tooltips
    d3.select('#tooltip-container').remove();
        
        // Create tooltip group
        const tooltip = svg.append('g')
            .attr('id', 'tooltip-container')
            .attr('class', 'tooltip-container');
        
        // Add background rectangle
        tooltip.append('rect')
            .attr('width', 300)
            .attr('height', 200);
        
        // Text wrapping function with improved line spacing
        function wrapText(text, width, xPos, yPos, className) {
            const words = text.split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            // Reduced line height to fix spacing between wrapped lines
            const lineHeight = className === 'tooltip-vegetation-name' ? 16 : 14;
            let tspan = tooltip.append('text')
                .attr('class', className)
                .attr('x', xPos)
                .attr('y', yPos)
                .append('tspan')
                .attr('x', xPos);
                
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > width - 30) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = tooltip.append('text')
                        .attr('class', className)
                        .attr('x', xPos)
                        .attr('y', yPos + (++lineNumber * lineHeight))
                        .append('tspan')
                        .attr('x', xPos)
                        .text(word);
                }
            }
            
            return lineNumber; // Return number of wrapped lines
        }
        
        // Add wrapped vegetation name text and get line count
        const vegetationNameLines = wrapText(name, 300, 15, 30, 'tooltip-vegetation-name');
        
        // Calculate base y-position for percentage based on name height
        // Base position + lines * line-height + 40px spacing
        const percentYPosition = 30 + (vegetationNameLines * 16) + 40;
        
        // Add percentage value with 40px space after name
        tooltip.append('text')
            .attr('class', 'tooltip-percentage')
            .attr('x', 15)
            .attr('y', percentYPosition)
            .text(`${percent.toFixed(1)}%`);
        
        // Add wrapped severity description 
        let description;
        if (severity === "total") {
            description = "of total burn area";
        } else {
            description = `of burn area considered ${severity} severity`;
        }

        wrapText(description, 300, 15, percentYPosition + 25, 'tooltip-description');
        
        // Only add hectare information if it's provided and we're in the Total row
        if (hectares !== undefined && severity === "total") {
            // Add hectare value with same styling as percentage
            tooltip.append('text')
                .attr('class', 'tooltip-percentage')
                .attr('x', 15)
                .attr('y', percentYPosition + 60)
                .text(`${hectares.toFixed(1)}`);
            
            // Add hectare description
            tooltip.append('text')
                .attr('class', 'tooltip-description')
                .attr('x', 15)
                .attr('y', percentYPosition + 85)
                .text("total hectares burned");
        }
        
        // Get dimensions for positioning
        const tooltipWidth = 300;
        const tooltipHeight = 200;
        const containerWidth = width;
        const containerHeight = height;
        
        // Check if cursor is in right half of container
        const isInRightHalf = x > containerWidth / 2;
        
        // Calculate position based on which half we're in
        let tooltipX;
        if (isInRightHalf) {
            // Position tooltip to the LEFT of cursor if in right half
            tooltipX = x - tooltipWidth - 10;
        } else {
            // Position tooltip to the RIGHT of cursor if in left half
            tooltipX = x + 10;
        }
        
        // Ensure tooltip stays within horizontal bounds
        tooltipX = Math.max(10, Math.min(containerWidth - tooltipWidth - 10, tooltipX));
        
        // Calculate vertical position (similar to before)
        let tooltipY = y - tooltipHeight - 10;
        
        // If tooltip would go above the container, position below cursor
        if (tooltipY < 0) {
            tooltipY = y + 10;
        }
        
        // If tooltip would go below container, adjust up
        if (tooltipY + tooltipHeight > containerHeight) {
            tooltipY = Math.max(10, containerHeight - tooltipHeight - 10);
        }
        
        // Set final position after all adjustments
        tooltip.attr('transform', `translate(${tooltipX}, ${tooltipY})`);
    }

    // Get the container dimensions
    const container = d3.select('#visualization-container');
    const margin = {top: 40, right: 40, bottom: 250, left: 100}; // Increased bottom margin for legend
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;
    
    // Transform CSV data to the format needed for the visualization
    const vegetationData = csvData.map(d => ({
        name: d.vegetation,
        totalPercent: +d.total_percent,
        highPerc: +d.high_percent,
        medPerc: +d.medium_percent,
        lowPerc: +d.low_percent,
        totalHa: +d.total_ha,
        color: d.color
    }));
    
    // Create data structure for the chart
    const data = [
        {
            category: "Total",
            total: 100,
            segments: vegetationData.map(d => ({
                name: d.name, 
                totalPercent: d.totalPercent,
                totalHa: d.totalHa, // Include this in the data structure
                color: d.color
            }))
        },
        {
            category: "High",
            total: 100,
            // Each vegetation type is represented by its totalPercent width
            // but internally divided into 3 segments with High at full opacity
            segments: vegetationData.map(d => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Low)`, percent: d.lowPerc, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Medium)`, percent: d.medPerc, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (High)`, percent: d.highPerc, color: d.color, opacity: 1.0 }
                ],
                color: d.color
            }))
        },
        {
            category: "Medium",
            total: 100,
            // Medium row with Medium segment at full opacity
            segments: vegetationData.map(d => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Low)`, percent: d.lowPerc, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Medium)`, percent: d.medPerc, color: d.color, opacity: 1.0 },
                    { name: `${d.name} (High)`, percent: d.highPerc, color: d.color, opacity: 0.3 }
                ],
                color: d.color
            }))
        },
        {
            category: "Low",
            total: 100,
            // Low row with Low segment at full opacity
            segments: vegetationData.map(d => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Low)`, percent: d.lowPerc, color: d.color, opacity: 1.0 },
                    { name: `${d.name} (Medium)`, percent: d.medPerc, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (High)`, percent: d.highPerc, color: d.color, opacity: 0.3 }
                ],
                color: d.color
            }))
        }
    ];

    // Process data to calculate cumulative positions
    const totalHeight = d3.sum(data, d => d.total);
    let yPosition = 0;
    
    data.forEach(category => {
        // Calculate cumulative Y positions
        category.y = yPosition;
        yPosition += category.total;
        
        // Calculate percentage width for each segment
        let xPosition = 0;
        
        if (category.category === "Total") {
            const categoryTotal = d3.sum(category.segments, d => d.totalPercent);
            
            category.segments.forEach(segment => {
                segment.x0 = xPosition / categoryTotal;
                xPosition += segment.totalPercent;
                segment.x1 = xPosition / categoryTotal;
            });
        } else {
            // For other categories, use the same width pattern as Total
            const totalSegments = data[0].segments;
            category.segments.forEach((segment, i) => {
                segment.x0 = totalSegments[i].x0;
                segment.x1 = totalSegments[i].x1;
            });
        }
    });

        // Debug data structure after processing
    console.log("Data structure after processing:", JSON.stringify(data, (key, value) => 
    typeof value === 'number' && isNaN(value) ? "NaN-VALUE" : value
    ));


    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Y scale for category heights
    const yScale = d3.scaleLinear()
        .domain([0, totalHeight])
        .range([0, height]);

    // Draw rectangles for each segment in each category
    data.forEach(category => {
        if (category.category === "Total") {
            // Regular drawing for Total row
            category.segments.forEach(segment => {
                svg.append('rect')
                    .attr('y', yScale(category.y))
                    .attr('x', segment.x0 * width)
                    .attr('height', yScale(category.total))
                    .attr('width', (segment.x1 - segment.x0) * width)
                    .attr('fill', segment.color)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1)
                    .on('mouseover', function(event) {
                        d3.select(this)
                            .attr('opacity', 0.8)
                            .attr('stroke', 'black')  // Changed from white to black
                            .attr('stroke-width', 2)
                            .attr('stroke-opacity', 1);
                        
                        // Get mouse position for better tooltip placement
                        const [mouseX, mouseY] = d3.pointer(event);
                        
                        // Show tooltip with custom information
                        showTooltip(
                            mouseX, 
                            mouseY, 
                            segment.name, 
                            segment.totalPercent,
                            segment.totalHa,
                            "total"
                        );
                    })
                    .on('mouseout', function() {
                        d3.select(this)
                            .attr('opacity', 1)
                            .attr('stroke', 'white')  // Reset to white on mouseout
                            .attr('stroke-width', 1);
                        
                        d3.select('#tooltip-container').remove();
                    });
            });
        } else {
            // For High, Medium, and Low rows with sub-segments
            category.segments.forEach(segment => {
                // Calculate the starting x position for this vegetation type
                const segmentWidth = (segment.x1 - segment.x0) * width;
                
                // Calculate sub-segment widths proportional to their percentages within the total
                const totalSubPercent = d3.sum(segment.subSegments, d => d.percent);
                let xOffset = segment.x0 * width;
                
                // Draw each sub-segment
                segment.subSegments.forEach(subSegment => {
                    // Calculate width for this sub-segment
                    const subWidth = (subSegment.percent / totalSubPercent) * segmentWidth;
                    
                    svg.append('rect')
                        .attr('y', yScale(category.y))
                        .attr('x', xOffset)
                        .attr('height', yScale(category.total))
                        .attr('width', subWidth)
                        .attr('fill', subSegment.color)
                        .attr('opacity', subSegment.opacity)
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1)
                        .on('mouseover', function(event) {
                            d3.select(this)
                                .attr('stroke', 'black')  // Changed from white to black
                                .attr('stroke-width', 2);
                            
                            // Get mouse position for better tooltip placement
                            const [mouseX, mouseY] = d3.pointer(event);
                            
                            // Simply use the category name to determine severity
                            let severity = category.category.toLowerCase(); // "High" -> "high", etc.
                            
                            // Show tooltip with custom information
                            showTooltip(
                                mouseX, 
                                mouseY, 
                                segment.name, 
                                subSegment.percent,
                                null,
                                severity
                            );
                        })
                        .on('mouseout', function() {
                            d3.select(this)
                                .attr('stroke', 'white')  // Reset to white on mouseout
                                .attr('stroke-width', 1);
                            
                            d3.select('#tooltip-container').remove();
                        });
                    
                    // Update xOffset for the next sub-segment
                    xOffset += subWidth;
                });
            });
        }
    });

    // Add category labels on the y-axis (left side)
    data.forEach(category => {
        svg.append('text')
            .attr('y', yScale(category.y) + yScale(category.total) / 2)
            .attr('x', -10) // Position to the left of the chart
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(category.category);
    });
    
    // Add stacked legend at the bottom with 4 items per column
    const legendItems = vegetationData.map(d => d.name);
    const itemsPerColumn = 4;
    const columnWidth = 500; // Width between columns - adjust as needed

    const legend = svg.append('g')
        .attr('transform', `translate(0, ${height + 60})`);
    
    // Title for the legend
    legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('text-anchor', 'start')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .text('Vegetation:');
    
    // Create legend items in columns of 4
    legendItems.forEach((item, i) => {
        const color = vegetationData.find(d => d.name === item).color;
        const columnIndex = Math.floor(i / itemsPerColumn);
        const rowIndex = i % itemsPerColumn;
        
        legend.append('rect')
            .attr('x', columnIndex * columnWidth)
            .attr('y', rowIndex * 20 + 5)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color);
        
        legend.append('text')
            .attr('x', columnIndex * columnWidth + 25)
            .attr('y', rowIndex * 20 + 17)
            .style('font-size', '12px')
            .text(item);
    });
}